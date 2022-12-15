import { z } from "zod"
import { successResponseSchemaFactory } from "../../interfaces/response"

// 无输入
// 输出
export const GetTopFoldersOutput = successResponseSchemaFactory(
  z.array(
    z.object({
      id: z.string(),
      lastModified: z.date(),
      title: z.string(),
      description: z.string().nullable(),
      authorId: z.string(),
      parentFolderId: z.string().nullable(),
    })
  )
)

export type GetTopFoldersOutput = z.infer<typeof GetTopFoldersOutput>
