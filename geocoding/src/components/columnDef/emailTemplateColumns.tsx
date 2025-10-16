"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Eye, Edit, Copy, Trash2, MoreHorizontal } from "lucide-react"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type EmailTemplate = {
  id: number
  template_key: string
  subject: string
  html_content: string
  text_content: string
  variables: Record<string, string>
  description: string
  is_active: boolean
  language_code: string
  base_template_id?: number
  is_base_template: boolean
  created_at: string
  updated_at: string
  created_by?: number
  updated_by?: number
}

interface EmailTemplateColumnsProps {
  onPreview: (template: EmailTemplate) => void
  onEdit: (template: EmailTemplate) => void
  onCopy: (template: EmailTemplate) => void
  onDelete: (template: EmailTemplate) => void
  t: (key: string) => string
}

export const createColumns = ({
  onPreview,
  onEdit,
  onCopy,
  onDelete,
  t,
}: EmailTemplateColumnsProps): ColumnDef<EmailTemplate>[] => [
  {
    accessorKey: "template_key",
    header: t('emailTemplates.templateKey'),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.getValue("template_key")}</span>
        {row.original.is_base_template && (
          <Badge className="bg-blue-100 text-blue-800 text-xs">{t('emailTemplates.baseTemplate')}</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "subject",
    header: t('emailTemplates.subject'),
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue("subject")}>
        {row.getValue("subject")}
      </div>
    ),
  },
  {
    accessorKey: "language_code",
    header: t('emailTemplates.languageCode'),
    cell: ({ row }) => {
      const languageCode = row.getValue("language_code") as string
      return (
        <Badge variant="outline" className="text-xs">
          {languageCode?.toUpperCase() || "EN"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: t('emailTemplates.isActive'),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge 
          variant={isActive ? "default" : "secondary"}
          className={isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-600"}
        >
          {isActive ? t('emailTemplates.active') : t('emailTemplates.inactive')}
        </Badge>
      )
    },
  },
  {
    accessorKey: "updated_at",
    header: t('emailTemplates.updatedAt'),
    cell: ({ row }) => (
      <span className="text-xs text-gray-500">
        {new Date(row.getValue("updated_at")).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "actions",
    header: t('emailTemplates.actions'),
    cell: ({ row }) => {
      const template = row.original
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(template)}
            className="h-8 w-8 p-0"
            title={t('emailTemplates.preview')}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                title="More actions"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('emailTemplates.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopy(template)}>
                <Copy className="h-4 w-4 mr-2" />
                {t('emailTemplates.copy')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(template)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('emailTemplates.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]