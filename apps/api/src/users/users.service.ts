import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateUser(createUserDto: CreateUserDto) {
    const { githubId, name, email, avatar } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { githubId },
    });

    if (existingUser) {
      return this.prisma.user.update({
        where: { githubId },
        data: { name, email, avatar },
      });
    }

    return this.prisma.user.create({
      data: { githubId, name, email, avatar },
    });
  }

  findOne(githubId: number) {
    return this.prisma.user.findUnique({
      where: { githubId },
    });
  }

  update(githubId: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { githubId },
      data: updateUserDto,
    });
  }

  remove(githubId: number) {
    return this.prisma.user.delete({
      where: { githubId },
    });
  }
}
