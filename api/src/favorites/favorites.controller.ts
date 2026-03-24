import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateFavoriteDto } from "./dto/create-favorite.dto";
import { FavoritesService } from "./favorites.service";
import { AuthenticatedUserGuard } from "src/common/guards/authenticated-user.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { AuthenticatedUser } from "src/common/interfaces/authenticated-user.interface";

@ApiTags("Favorites")
@ApiBearerAuth()
@Controller("favorites")
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiOperation({ summary: "Create a favorite" })
  @ApiResponse({ status: 201, description: "Favorite created." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 409, description: "Tool already favorited." })
  @UseGuards(AuthenticatedUserGuard)
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createFavoriteDto: CreateFavoriteDto
  ) {
    return this.favoritesService.create(user.id, createFavoriteDto.toolId);
  }

  @ApiOperation({ summary: "Check if a tool is favorited by the current user" })
  @ApiResponse({ status: 200, description: "Returns { isFavorite: boolean }." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @UseGuards(AuthenticatedUserGuard)
  @Get("check")
  checkFavorite(
    @CurrentUser("id") userId: number,
    @Query("toolId", ParseUUIDPipe) toolId: string
  ) {
    return this.favoritesService.checkFavorite(userId, toolId);
  }

  @ApiOperation({ summary: "Get all favorites for a user" })
  @ApiResponse({ status: 200, description: "List of favorites with tool details." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden — can only view own favorites." })
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

  @ApiOperation({ summary: "Toggle favorite status for a tool" })
  @ApiResponse({ status: 200, description: "Returns { isFavorite: boolean }." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "User or tool not found." })
  @UseGuards(AuthenticatedUserGuard)
  @Post("toggle")
  @HttpCode(200)
  toggleFavorite(
    @CurrentUser("id") userId: number,
    @Body("toolId", ParseUUIDPipe) toolId: string
  ) {
    return this.favoritesService.toggleFavorite(userId, toolId);
  }

  @ApiOperation({ summary: "Get a favorite by ID" })
  @ApiResponse({ status: 200, description: "Favorite record." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @UseGuards(AuthenticatedUserGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.favoritesService.findOne(id);
  }

  @ApiOperation({ summary: "Delete a favorite by ID" })
  @ApiResponse({ status: 200, description: "Favorite deleted." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 403, description: "Forbidden — can only delete own favorites." })
  @ApiResponse({ status: 404, description: "Favorite not found." })
  @UseGuards(AuthenticatedUserGuard)
  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentUser("id") currentUserId: number
  ) {
    const favorite = await this.favoritesService.findOne(id);

    if (!favorite) {
      throw new NotFoundException("Favorite not found");
    }

    if (favorite.userId !== currentUserId) {
      throw new ForbiddenException();
    }

    return this.favoritesService.remove(id);
  }
}
