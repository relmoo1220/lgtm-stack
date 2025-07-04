import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post('create')
  create(@Body() createBook: Book) {
    return this.booksService.create(createBook);
  }

  @Get('find')
  findAll() {
    return this.booksService.findAll();
  }

  @Get('find/:id')
  findOne(@Param('id') id: number) {
    return this.booksService.findOne(+id);
  }

  @Put('update/:id')
  update(@Param('id') id: number, @Body() updateBook: Book) {
    return this.booksService.update(+id, updateBook);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: number) {
    return this.booksService.remove(+id);
  }
}
