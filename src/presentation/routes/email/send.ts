import rescue from 'express-rescue'
import { boom } from '@expresso/errors'
import { validate } from '@expresso/validator'
import { Request, Response, NextFunction } from 'express'
import { EmailService } from '../../../services/EmailService'
import { IEmail } from '../../../domain/email/structures/IEmail'
import { RendererNotFoundError } from '../../../services/errors/RendererNotFoundError'
import { InvalidRendererError } from '../../../services/errors/InvalidRendererError'
import { RendererError } from '../../../services/errors/RendererError'

export default function (service: EmailService) {
  return [
    validate({
      type: 'object',
      properties: {
        from: { oneOf: [{ type: 'string', format: 'email' }, { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } }] },
        to: {
          type: 'array',
          items: {
            anyOf: [{ type: 'string', format: 'email' }, { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } }]
          }
        },
        subject: {
          type: 'string'
        },
        template: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            lang: { type: 'string' }
          },
          additionalProperties: false,
          required: ['text', 'lang']
        },
        cc: {
          type: 'array',
          items: {
            anyOf: [{ type: 'string', format: 'email' }, { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } }]
          }
        },
        data: {
          type: 'object'
        },
        replyTo: {
          oneOf: [{ type: 'string', format: 'email' }, { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } }]
        },
        bcc: {
          type: 'array',
          items: {
            anyOf: [{ type: 'string', format: 'email' }, { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } }]
          }
        }
      },
      required: ['to', 'subject', 'template'],
      additionalProperties: false
    }),
    rescue(async (req: Request, res: Response) => {
      const data = req.body as IEmail
      const entity = await service.sendEmail(data)

      res.status(202)
        .json(entity.toObject())
    }),
    (err: any, _req: Request, _res: Response, next: NextFunction) => {
      if (err instanceof RendererError) return next(boom.badImplementation(err.message, { code: 'failed_to_parse_template' }))
      if (err instanceof RendererNotFoundError) return next(boom.notFound(err.message, { code: 'renderer_not_found' }))
      if (err instanceof InvalidRendererError) return next(boom.internal(err.message, { code: 'invalid_render' }))
      next(err)
    }
  ]
}
