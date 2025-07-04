import { Injectable } from '@nestjs/common';
import { Book } from './entities/book.entity';
import { OtelMethodCounter, Span, TraceService } from 'nestjs-otel';
import { Logger } from 'nestjs-pino';

@Injectable()
export class BooksService {
  constructor(
    private readonly traceService: TraceService,
    private readonly logger: Logger,
  ) {}

  private books: Book[] = [];
  private nextId = 1;

  @Span('create section')
  @OtelMethodCounter()
  create(createBook: Book) {
    const { id, ...rest } = createBook;
    this.logger.log(`Creating book with ${id}: ${createBook}`);
    const newBook: Book = {
      id: this.nextId++,
      ...rest,
    };
    this.books.push(newBook);
    return newBook;
  }

  @Span('findAll section')
  @OtelMethodCounter()
  findAll() {
    this.logger.log(`Finding all books`);
    return this.books;
  }

  @Span('findOne section')
  @OtelMethodCounter()
  findOne(id: number) {
    this.logger.log(`Finding book with id: ${id}`);
    return this.books.find((book) => book.id === id);
  }

  @Span('update section')
  @OtelMethodCounter()
  update(id: number, updateBook: Book) {
    this.logger.log(`Updating book with id: ${id}`);
    const bookIndex = this.books.findIndex((book) => book.id === id);
    if (bookIndex === -1) return null; // or throw NotFoundException

    this.books[bookIndex] = {
      ...this.books[bookIndex],
      ...updateBook,
    };
    return this.books[bookIndex];
  }

  @Span('remove section')
  @OtelMethodCounter()
  remove(id: number) {
    this.logger.log(`Removing book with id: ${id}`);
    const bookIndex = this.books.findIndex((book) => book.id === id);
    if (bookIndex === -1) return null; // or throw NotFoundException

    const removedBook = this.books.splice(bookIndex, 1);
    return removedBook[0];
  }
}
