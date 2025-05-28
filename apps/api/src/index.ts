import { join } from 'node:path'
import autoLoad from '@fastify/autoload'
import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastify from 'fastify'
import {
  type FastifyZodOpenApiTypeProvider,
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransform,
  fastifyZodOpenApiTransformObject,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-zod-openapi'
import { errorHandler, notFoundHandler } from './utils/errors'

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)
app.setNotFoundHandler(notFoundHandler)

app.withTypeProvider<FastifyZodOpenApiTypeProvider>()

app.register(fastifyZodOpenApiPlugin)
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'SourceLane',
      description:
        'The open-source project management tool for software teams.',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: fastifyZodOpenApiTransform,
  transformObject: fastifyZodOpenApiTransformObject,
})

app.register(import('@scalar/fastify-api-reference'), {
  routePrefix: '/docs',
  configuration: {
    defaultHttpClient: {
      targetKey: 'node',
      clientKey: 'axios',
    },
  },
})

app.register(fastifyCors)

app.register(autoLoad, {
  dir: join(__dirname, 'routes'),
})

app.listen({ port: 5000 }).then(() => {
  const url = 'http://localhost:5000'
  console.log(
    `Server is running on ${url}.`,
    `Access API documentation at ${url}/docs.`,
  )
})
