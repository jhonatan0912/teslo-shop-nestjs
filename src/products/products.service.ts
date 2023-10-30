import { BadRequestException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { DataSource, Repository } from "typeorm";
import { validate as isUUID } from "uuid";
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductImage } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService'); // create a new logger

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly datasource: DataSource,
  ) { }

  async create(createProductDto: CreateProductDto) {

    try {

      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({ url: image })),
      }); // create a new query but not save it

      await this.productRepository.save(product); // save the query

      return {
        ...product,
        images: images,
      };

    } catch (error) {
      this.handleDBExceptions(error);
    }
  };

  async findAll(paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    try {
      const products = await this.productRepository.find(
        {
          skip: offset,
          take: limit,
          cache: true,
          relations: {
            images: true,

          }
        }
      );

      return products.map(({ images, ...rest }) => ({
        ...rest,
        images: images.map(image => image.url)
      }));
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuild = this.productRepository.createQueryBuilder('product');

      product = await queryBuild
        .where('UPPER(title) =:title OR slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('product.images', 'images')
        .getOne();
    }

    if (!product) throw new NotFoundException(`Product with ${term} not found!}`);

    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);

    return {
      ...rest,
      images: images.map(image => image.url)
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate }); // preload the product with the new data but not save it

    if (!product) throw new NotFoundException(`Product with ${id} not found!`);

    // Create Query Runner
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });

        product.images = images.map(
          image => this.productImageRepository.create({ url: image })
        );

      }
      
      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id);
    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExceptions(error);
    }

  }

  async remove(id: string) {
    const product = await this.findOne(id); // find a product by id
    await this.productRepository.remove(product); // remove the product
  }

  private handleDBExceptions(error: any) {

    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error);

    throw new HttpException(error.response.message ?? 'Unexpected error, check server logs', error.status);
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
