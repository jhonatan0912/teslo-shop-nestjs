import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {

  constructor(
    private readonly productsService: ProductsService
  ) { }

  async runSeed() {
    await this.inserNewProducts();

    return 'SEED EXECUTED';
  }

  private async inserNewProducts() {
    await this.productsService.deleteAllProducts();

    const products = initialData.products;

    const insertPromises = [];

    products.forEach(product => {
      insertPromises.push(this.productsService.create(product));
    });

    await Promise.all(insertPromises); // wait for all promises to be resolved

    return true;
  }

}
