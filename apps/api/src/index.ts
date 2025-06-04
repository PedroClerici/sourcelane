import { join } from 'node:path'
import autoLoad from '@fastify/autoload'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
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
import { env } from './utils/env'
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
app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(autoLoad, {
  dir: join(__dirname, 'routes'),
  dirNameRoutePrefix: false,
})

app.listen({ port: env.PORT }).then(() => {
  const url = `http://${env.ADDRESS}:${env.PORT}`
  console.log(`Server is running on ${url}`)
  console.log(`Access API documentation at ${url}/docs`)
  console.group
})
