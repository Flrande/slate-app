import { Injectable } from "@nestjs/common"
import { Folder, Prisma, RoleType, SurvivalStatus, User } from "@prisma/client"
import { PrismaService } from "src/database/prisma.service"
import { CommonException } from "src/exception/common.exception"
import { DELETE_EXPIRE_DAY_TIME, DocExceptionCode } from "../doc.constant"
import { FolderAuthService } from "./auth/folder-auth.service"

@Injectable()
export class FolderService {
  constructor(private readonly prismaService: PrismaService, private readonly folderAuthService: FolderAuthService) {}

  /**
   * 根据 id 查询文件夹信息
   *
   * 需要操作者的用户 id, 用于判断操作者是否有权限获得文件夹信息
   */
  async getFolderById(
    userId: User["id"],
    folderId: Folder["id"]
  ): Promise<
    Pick<Folder, "id" | "lastModify" | "title" | "description" | "lastDeleted" | "authorId" | "parentFolderId">
  > {
    // 校验权限
    const flag = await this.folderAuthService.verifyUserReadFolder(userId, folderId)
    if (!flag) {
      throw new CommonException({
        code: DocExceptionCode.CURRENT_USER_CAN_NOT_READ_THIS_FOLDER,
        message: `当前用户无权阅读文件夹(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    const result = await this.prismaService.folder.findUnique({
      where: {
        id: folderId,
      },
      select: {
        id: true,
        lastModify: true,
        title: true,
        description: true,
        lastDeleted: true,
        survivalStatus: true,
        authorId: true,
        parentFolderId: true,
      },
    })

    if (!result) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_READ_BUT_FOLDER_NOT_FOUND,
        message: `未能找到文件夹信息(文件夹id: ${folderId})`,
      })
    }

    if (result.survivalStatus !== SurvivalStatus.ALIVE) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_READ_BUT_FOLDER_DELETED,
        message: `该文件夹已被删除(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    return {
      id: result.id,
      lastModify: result.lastModify,
      title: result.title,
      description: result.authorId,
      lastDeleted: result.lastDeleted,
      authorId: result.authorId,
      parentFolderId: result.parentFolderId,
    }
  }

  /**
   * 接受用户 id, 返回该用户个人空间的顶部文件夹
   */
  async getTopFolders(
    userId: User["id"]
  ): Promise<Pick<Folder, "id" | "lastModify" | "title" | "description" | "authorId" | "parentFolderId">[]> {
    const result = await this.prismaService.folder.findMany({
      where: {
        authorId: userId,
        parentFolder: null,
        survivalStatus: SurvivalStatus.ALIVE,
      },
      select: {
        id: true,
        lastModify: true,
        title: true,
        description: true,
        authorId: true,
        parentFolderId: true,
      },
    })

    return result
  }

  /**
   * 接受用户 id, 返回该用户主页快速访问的文件夹
   */
  async getFastAccessFolders(
    userId: User["id"]
  ): Promise<Pick<Folder, "id" | "lastModify" | "title" | "description" | "authorId" | "parentFolderId">[]> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        fastAccessFolders: {
          select: {
            id: true,
            lastModify: true,
            title: true,
            description: true,
            authorId: true,
            parentFolderId: true,
          },
        },
      },
    })

    if (!user) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_READ_FAST_ACCESS_BUT_USER_NOT_FOUND,
        message: `未能找到用户信息(用户id: ${userId})`,
      })
    }

    return user.fastAccessFolders
  }

  /**
   * 接受用户 id, 返回该用户收藏的文件夹
   */
  async getFavoriteFolders(
    userId: User["id"]
  ): Promise<Pick<Folder, "id" | "lastModify" | "title" | "description" | "authorId" | "parentFolderId">[]> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        favoriteFolders: {
          select: {
            id: true,
            lastModify: true,
            title: true,
            description: true,
            authorId: true,
            parentFolderId: true,
          },
        },
      },
    })

    if (!user) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_READ_FAVORITE_BUT_USER_NOT_FOUND,
        message: `未能找到用户信息(用户id: ${userId})`,
      })
    }

    return user.favoriteFolders
  }

  /**
   * 接受用户 id, 返回该用户可回收的文件夹
   */
  async getDeletedFolders(
    userId: User["id"]
  ): Promise<
    Pick<Folder, "id" | "lastModify" | "title" | "description" | "authorId" | "lastDeleted" | "parentFolderId">[]
  > {
    const result = await this.prismaService.folder.findMany({
      where: {
        authorId: userId,
        survivalStatus: SurvivalStatus.DELETED,
      },
      select: {
        id: true,
        lastModify: true,
        title: true,
        description: true,
        authorId: true,
        lastDeleted: true,
        parentFolderId: true,
      },
    })

    return result
  }

  /**
   * 创建新的文件夹
   *
   * 需要操作者的用户 id, 用于判断操作者是否有权限在该文件夹上新建文件夹
   */
  async createFolder(
    userId: User["id"],
    data: Pick<Folder, "title" | "description" | "parentFolderId">
  ): Promise<Pick<Folder, "id" | "lastModify" | "title" | "description" | "authorId" | "parentFolderId">> {
    // 校验权限
    const flag = data.parentFolderId
      ? await this.folderAuthService.verifyUserWriteFolder(userId, data.parentFolderId)
      : true
    if (!flag) {
      throw new CommonException({
        code: DocExceptionCode.CURRENT_USER_CAN_NOT_WRITE_THIS_FOLDER,
        message: `当前用户无权写文件夹(文件夹id: ${data.parentFolderId})`,
        isFiltered: false,
      })
    }

    const author = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    })

    if (!author) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_CREATE_BUT_USER_NOT_FOUND,
        message: `未找到用户信息(用户id: ${userId})`,
      })
    }

    const createPayload: Prisma.FolderCreateInput = {
      lastModify: new Date(),
      title: data.title,
      description: data.description,
      author: {
        connect: author,
      },
    }

    if (data.parentFolderId) {
      // 查询父文件夹信息
      const folder = await this.prismaService.folder.findUnique({
        where: {
          id: data.parentFolderId,
        },
        select: {
          id: true,
        },
      })

      if (!folder) {
        throw new CommonException({
          code: DocExceptionCode.FOLDER_CREATE_BUT_PARENT_FOLDER_NOT_FOUND,
          message: `未找到父文件夹信息(父文件夹id: ${data.parentFolderId})`,
        })
      }

      const folderAdministratorRole = await this.prismaService.role.findFirst({
        where: {
          folder,
          roleType: RoleType.ADMINISTRATOR,
        },
      })

      if (!folderAdministratorRole) {
        throw new CommonException({
          code: DocExceptionCode.FOLDER_ADMINISTRATOR_ROLE_NOT_FOUND,
          message: `未找到父文件夹对应的管理员权限(父文件夹id: ${data.parentFolderId})`,
        })
      }

      const folderCollaboratorRole = await this.prismaService.role.findFirst({
        where: {
          folder,
          roleType: RoleType.COLLABORATOR,
        },
      })

      if (!folderCollaboratorRole) {
        throw new CommonException({
          code: DocExceptionCode.FOLDER_COLLABORATOR_ROLE_NOT_FOUND,
          message: `未找到父文件夹对应的协作者权限(父文件夹id: ${data.parentFolderId})`,
        })
      }

      const folderReaderRole = await this.prismaService.role.findFirst({
        where: {
          folder,
          roleType: RoleType.READER,
        },
      })

      if (!folderReaderRole) {
        throw new CommonException({
          code: DocExceptionCode.FOLDER_READER_ROLE_NOT_FOUND,
          message: `未找到父文件夹对应的阅读者权限(父文件夹id: ${data.parentFolderId})`,
        })
      }

      // 将新文件夹与父文件夹关联
      createPayload.parentFolder = {
        connect: {
          id: folder.id,
        },
      }

      // 新建文件夹
      const createFolderResult = await this.prismaService.folder.create({
        data: createPayload,
        select: {
          id: true,
          lastModify: true,
          title: true,
          description: true,
          authorId: true,
          parentFolderId: true,
        },
      })

      // 添加新文件夹的三个角色
      // 管理者角色
      const createAdministratorRoleResult = await this.prismaService.role.create({
        data: {
          roleType: RoleType.ADMINISTRATOR,
          folder: {
            connect: {
              id: createFolderResult.id,
            },
          },
          parentRoles: {
            connect: {
              id: folderAdministratorRole.id,
            },
          },
          // 将新文件夹的管理者角色和新文件夹作者相关联
          users: {
            connect: {
              id: author.id,
            },
          },
        },
      })
      // 协作者角色
      const createCollaboratorRoleResult = await this.prismaService.role.create({
        data: {
          roleType: RoleType.COLLABORATOR,
          folder: {
            connect: {
              id: createFolderResult.id,
            },
          },
          parentRoles: {
            connect: [{ id: folderCollaboratorRole.id }, { id: createAdministratorRoleResult.id }],
          },
        },
      })
      // 阅读者角色
      await this.prismaService.role.create({
        data: {
          roleType: RoleType.READER,
          folder: {
            connect: {
              id: createFolderResult.id,
            },
          },
          parentRoles: {
            connect: [{ id: folderReaderRole.id }, { id: createCollaboratorRoleResult.id }],
          },
        },
      })

      return createFolderResult
    } else {
      const createFolderResult = await this.prismaService.folder.create({
        data: createPayload,
        select: {
          id: true,
          lastModify: true,
          title: true,
          description: true,
          authorId: true,
          parentFolderId: true,
        },
      })

      // 添加新文件夹的三个角色
      // 管理者角色
      const createAdministratorRoleResult = await this.prismaService.role.create({
        data: {
          roleType: RoleType.ADMINISTRATOR,
          folder: {
            connect: {
              id: createFolderResult.id,
            },
          },
          // 将新文件夹的管理者角色和新文件夹作者相关联
          users: {
            connect: {
              id: author.id,
            },
          },
        },
      })
      // 协作者角色
      const createCollaboratorRoleResult = await this.prismaService.role.create({
        data: {
          roleType: RoleType.COLLABORATOR,
          folder: {
            connect: {
              id: createFolderResult.id,
            },
          },
          parentRoles: {
            connect: {
              id: createAdministratorRoleResult.id,
            },
          },
        },
      })
      // 阅读者角色
      await this.prismaService.role.create({
        data: {
          roleType: RoleType.READER,
          folder: {
            connect: {
              id: createFolderResult.id,
            },
          },
          parentRoles: {
            connect: {
              id: createCollaboratorRoleResult.id,
            },
          },
        },
      })

      return createFolderResult
    }
  }

  /**
   * 为用户添加新的快速访问文件夹
   *
   * 需要操作者的用户 id, 用于判断操作者是否有权限获得文件夹信息
   */
  async addFastAccessFolder(userId: User["id"], folderId: Folder["id"]): Promise<void> {
    // 校验是否有读权限
    const flag = await this.folderAuthService.verifyUserReadFolder(userId, folderId)
    if (!flag) {
      throw new CommonException({
        code: DocExceptionCode.CURRENT_USER_CAN_NOT_READ_THIS_FOLDER,
        message: `当前用户无权阅读文件夹(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    const folder = await this.prismaService.folder.findUnique({
      where: {
        id: folderId,
      },
    })

    if (!folder) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_CREATE_FAST_ACCESS_BUT_FOLDER_NOT_FOUND,
        message: `未能找到文件夹信息(文件夹id: ${folderId})`,
      })
    }

    if (folder.survivalStatus !== SurvivalStatus.ALIVE) {
      throw new CommonException({
        code: DocExceptionCode.GENERAL_DOC_CREATE_FAST_ACCESS_BUT_DOC_DELETED,
        message: `文件夹已被删除(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        fastAccessFolders: {
          connect: {
            id: folderId,
          },
        },
      },
    })
  }

  /**
   * 为用户添加新的收藏文件夹
   *
   * 需要操作者的用户 id, 用于判断操作者是否有权限获得文件夹信息
   */
  async addFavoriteFolder(userId: User["id"], folderId: Folder["id"]): Promise<void> {
    // 校验是否有读权限
    const flag = await this.folderAuthService.verifyUserReadFolder(userId, folderId)
    if (!flag) {
      throw new CommonException({
        code: DocExceptionCode.CURRENT_USER_CAN_NOT_READ_THIS_FOLDER,
        message: `当前用户无权阅读文件夹(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    const folder = await this.prismaService.folder.findUnique({
      where: {
        id: folderId,
      },
    })

    if (!folder) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_CREATE_FAVORITE_BUT_FOLDER_NOT_FOUND,
        message: `未能找到文件夹信息(文件夹id: ${folderId})`,
      })
    }

    if (folder.survivalStatus !== SurvivalStatus.ALIVE) {
      throw new CommonException({
        code: DocExceptionCode.GENERAL_DOC_CREATE_FAVORITE_BUT_DOC_DELETED,
        message: `文件夹已被删除(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        favoriteFolders: {
          connect: {
            id: folderId,
          },
        },
      },
    })
  }

  /**
   * 移除快速访问文件夹
   */
  async removeFastAccessFolder(userId: User["id"], folderId: Folder["id"]): Promise<void> {
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        fastAccessFolders: {
          disconnect: {
            id: folderId,
          },
        },
      },
    })
  }

  /**
   * 移除收藏文件夹
   */
  async removeFavoriteFolder(userId: User["id"], folderId: Folder["id"]): Promise<void> {
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        favoriteFolders: {
          disconnect: {
            id: folderId,
          },
        },
      },
    })
  }

  /**
   * 根据 id 将文件夹删除, 传入的 type 决定是可回收的删除还是彻底删除, soft 是可回收的删除, hard 是彻底删除
   *
   * 需要操作者的用户 id, 用于判断操作者是否有权限删除文件夹
   */
  async deleteFolder(userId: User["id"], folderId: Folder["id"], type: "soft" | "hard"): Promise<void> {
    const folderData = await this.prismaService.folder.findUnique({
      where: {
        id: folderId,
      },
    })

    if (!folderData) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_DELETE_BUT_FOLDER_NOT_FOUND,
        message: `未能找到文件夹信息(id: ${folderId})`,
      })
    }

    // 校验权限
    const flag = await this.folderAuthService.verifyUserAdministerFolder(userId, folderId)
    if (!flag) {
      throw new CommonException({
        code: DocExceptionCode.CURRENT_USER_CAN_NOT_MANAGE_THIS_FOLDER,
        message: `当前用户没有该文件夹的管理权限(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    // 删除文件夹时要连同文件夹下的所有子项删除
    await this.prismaService.$transaction([
      this.prismaService.$executeRaw`create temporary table tmp_table_for_delete_folder on
      commit drop as
      with recursive folder_traverse(
      id,
      parent_folder_id,
      survival_status
      ) as (
      with recursive doc_traverse(
      id,
      parent_folder_id,
      survival_status
      ) as
            (
      select
        id,
        parent_folder_id,
        survival_status
      from
        folder
      where
        folder.id = ${folderId}
      union
      select
        doc.id,
        doc.parent_folder_id,
        doc.survival_status
      from
        doc
      join doc_traverse on
        doc_traverse.id = doc.parent_folder_id
      where
        doc.survival_status <> 'COMPLETELY_DELETED'::"SurvivalStatus"
        )
      select
        id,
        parent_folder_id,
        survival_status
      from
        doc_traverse
      union
      select
        folder.id,
        folder.parent_folder_id,
        folder.survival_status
      from
        folder
      join folder_traverse on
        folder_traverse.id = folder.parent_folder_id
      where
        folder.survival_status <> 'COMPLETELY_DELETED'::"SurvivalStatus"
        )
        select
        *
      from
        folder_traverse;`,
      this.prismaService.$executeRaw`update folder
        set survival_status = ${
          type === "soft" ? SurvivalStatus.DELETED : SurvivalStatus.COMPLETELY_DELETED
        }::"SurvivalStatus",
          last_deleted = current_timestamp(3)
        from tmp_table_for_delete_folder
        where tmp_table_for_delete_folder.id = folder.id;`,
      this.prismaService.$executeRaw`update doc
        set survival_status = ${
          type === "soft" ? SurvivalStatus.DELETED : SurvivalStatus.COMPLETELY_DELETED
        }::"SurvivalStatus",
          last_deleted = current_timestamp(3)
        from tmp_table_for_delete_folder
        where tmp_table_for_delete_folder.id = doc.id;`,
    ])
  }

  /**
   * 根据 id 将已删除的文件夹恢复, 若已彻底删除, 不可恢复
   *
   * 需要操作者的用户 id, 用于判断操作者是否有权限恢复文件夹
   */
  async revertFolder(userId: User["id"], folderId: Folder["id"]): Promise<void> {
    const folderData = await this.prismaService.folder.findUnique({
      where: {
        id: folderId,
      },
    })

    if (!folderData) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_DELETE_REVERT_BUT_FOLDER_NOT_FOUND,
        message: `未能找到文件夹信息(文件夹id: ${folderId})`,
      })
    }

    // 校验权限
    const flag = await this.folderAuthService.verifyUserAdministerFolder(userId, folderId)
    if (!flag) {
      throw new CommonException({
        code: DocExceptionCode.CURRENT_USER_CAN_NOT_MANAGE_THIS_FOLDER,
        message: `当前用户没有该文件夹的管理权限(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    // 判断是否彻底删除
    if (folderData.survivalStatus === SurvivalStatus.COMPLETELY_DELETED) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_DELETE_REVERT_FAIL,
        message: `文件夹已被彻底删除(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    // 判断是否已过期
    const currentTime = new Date()
    if (
      folderData.lastDeleted &&
      (currentTime.getTime() - folderData.lastDeleted.getTime()) / (1000 * 3600 * 24) > DELETE_EXPIRE_DAY_TIME
    ) {
      throw new CommonException({
        code: DocExceptionCode.FOLDER_DELETE_REVERT_TOO_LATE,
        message: `文件夹已过期(文件夹id: ${folderId})`,
        isFiltered: false,
      })
    }

    // 恢复文件夹时要连同文件夹下的所有子项恢复
    await this.prismaService.$transaction([
      this.prismaService.$executeRaw`create temporary table tmp_table_for_delete_folder on
      commit drop as
      with recursive folder_traverse(
      id,
      parent_folder_id,
      survival_status
      ) as (
      with recursive doc_traverse(
      id,
      parent_folder_id,
      survival_status
      ) as
            (
      select
        id,
        parent_folder_id,
        survival_status
      from
        folder
      where
        folder.id = ${folderId}
      union
      select
        doc.id,
        doc.parent_folder_id,
        doc.survival_status
      from
        doc
      join doc_traverse on
        doc_traverse.id = doc.parent_folder_id
      where
        doc.survival_status = 'DELETED'::"SurvivalStatus"
        )
      select
        id,
        parent_folder_id,
        survival_status
      from
        doc_traverse
      union
      select
        folder.id,
        folder.parent_folder_id,
        folder.survival_status
      from
        folder
      join folder_traverse on
        folder_traverse.id = folder.parent_folder_id
      where
        folder.survival_status = 'DELETED'::"SurvivalStatus"
        )
        select
        *
      from
        folder_traverse;`,
      this.prismaService.$executeRaw`update folder
        set survival_status = 'ALIVE'::"SurvivalStatus",
          last_deleted = null
        from tmp_table_for_delete_folder
        where tmp_table_for_delete_folder.id = folder.id;`,
      this.prismaService.$executeRaw`update doc
        set survival_status = 'ALIVE'::"SurvivalStatus",
          last_deleted = null
        from tmp_table_for_delete_folder
        where tmp_table_for_delete_folder.id = doc.id;`,
    ])
  }
}