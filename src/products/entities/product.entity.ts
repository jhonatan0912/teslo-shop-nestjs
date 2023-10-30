import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate, OneToMany } from "typeorm";
import { ProductImage } from './product-image.entity';


@Entity({ name: 'products' })
export class Product {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column(
    'text',
    { unique: true }
  )
  title: string;

  @Column(
    'float',
    { default: 0 }
  )
  price: number;

  @Column({
    type: 'text',
    nullable: true
  })
  description: string;

  @Column({
    type: 'text',
    unique: true,
  })
  slug: string;

  @Column({
    type: 'int',
    default: 0
  })
  stock: number;

  @Column({
    type: 'text',
    array: true,
  })
  sizes: string[];

  @Column({
    type: 'text',
  })
  gender: string;

  @Column({
    type: 'text',
    array: true,
    default: []
  })
  tags: string[];

  @OneToMany(
    () => ProductImage,
    productImage => productImage.product,
    {
      cascade: true, // cascade means that if we delete a product, all its images will be deleted too
      eager: true, // eager means that when we fetch a product, all its images will be fetched too
    }
  )
  images: ProductImage[];


  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.transformSlug(this.slug);
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.transformSlug(this.slug);
  }

  private transformSlug(slug: string) {
    return slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll('-', '_')
      .replaceAll("'", '');
  }
}
