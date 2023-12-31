import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from "uuid";

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService'); // create a new logger

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) { }

  async create(createProductDto: CreateProductDto) {

    try {
      const product = this.productRepository.create(createProductDto); // create a new query but not save it

      await this.productRepository.save(product); // save the query

      return product;

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
        }
      );

      return products;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      const queryBuild = this.productRepository.createQueryBuilder();

      product = await queryBuild
        .where('UPPER(title) =:title OR slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        }).getOne();
    }

    if (!product) throw new NotFoundException(`Product with ${term} not found!}`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    });

    if (!product) throw new NotFoundException(`Product with ${id} not found!`);

    try {
      await this.productRepository.save(product);

      return product
    } catch (error) {
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
}
