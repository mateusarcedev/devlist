import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";
import { FavoritesService } from "./favorites.service";
import { AuthenticatedUserGuard } from "src/common/guards/authenticated-user.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { AuthenticatedUser } from "src/common/interfaces/authenticated-user.interface";

@Controller("favorites")
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @UseGuards(AuthenticatedUserGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createFavoriteDto: CreateFavoriteDto
  ) {
    return this.favoritesService.create(user.id, createFavoriteDto.toolId);
  }

  @UseGuards(AuthenticatedUserGuard)
  @Get("check")
  checkFavorite(
    @CurrentUser("id") userId: number,
    @Query("toolId", ParseUUIDPipe) toolId: string
  ) {
    return this.favoritesService.checkFavorite(userId, toolId);
  }

  @UseGuards(AuthenticatedUserGuard)
  @Get("user/:userId")
  getFavoritesByUserId(
    @Param("userId", ParseIntPipe) userId: number,
    @CurrentUser("id") currentUserId: number
  ) {
    if (currentUserId !== userId) {
      throw new ForbiddenException();
    }

    return this.favoritesService.getFavoritesByUserId(userId);
  }

  @UseGuards(AuthenticatedUserGuard)
  @Post("toggle")
  toggleFavorite(
    @CurrentUser("id") userId: number,
    @Body("toolId", ParseUUIDPipe) toolId: string
  ) {
    return this.favoritesService.toggleFavorite(userId, toolId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.favoritesService.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.favoritesService.remove(id);
  }
}
