import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FastTrack Logistics API',
      version: '1.0.0',
      description: 'API for managing shipments and synchronizing with external carrier',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      schemas: {
        Shipment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique shipment identifier',
            },
            orderId: {
              type: 'string',
              description: 'Order ID (unique)',
              maxLength: 50,
            },
            customerName: {
              type: 'string',
              description: 'Customer name',
              maxLength: 255,
            },
            destination: {
              type: 'string',
              description: 'Destination address',
              maxLength: 500,
            },
            status: {
              $ref: '#/components/schemas/ShipmentStatus',
            },
            lastSyncedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last synchronization timestamp',
            },
            carrierRef: {
              type: 'string',
              nullable: true,
              description: 'External carrier reference ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'orderId', 'customerName', 'destination', 'status', 'createdAt', 'updatedAt'],
        },
        ShipmentStatus: {
          type: 'string',
          enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
          description: 'Shipment status',
        },
        CreateShipment: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              description: 'Order ID (must be unique)',
              minLength: 1,
              maxLength: 50,
            },
            customerName: {
              type: 'string',
              description: 'Customer name',
              minLength: 1,
              maxLength: 255,
            },
            destination: {
              type: 'string',
              description: 'Destination address',
              minLength: 1,
              maxLength: 500,
            },
            status: {
              $ref: '#/components/schemas/ShipmentStatus',
            },
          },
          required: ['orderId', 'customerName', 'destination'],
        },
        UpdateShipment: {
          type: 'object',
          properties: {
            customerName: {
              type: 'string',
              description: 'Customer name',
              minLength: 1,
              maxLength: 255,
            },
            destination: {
              type: 'string',
              description: 'Destination address',
              minLength: 1,
              maxLength: 500,
            },
            status: {
              $ref: '#/components/schemas/ShipmentStatus',
            },
          },
        },
        PaginatedShipments: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Shipment',
              },
            },
            meta: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  description: 'Total number of shipments',
                },
                page: {
                  type: 'integer',
                  description: 'Current page number',
                },
                limit: {
                  type: 'integer',
                  description: 'Items per page',
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total number of pages',
                },
              },
            },
          },
        },
        SyncResult: {
          type: 'object',
          properties: {
            synced: {
              type: 'integer',
              description: 'Number of successfully synced shipments',
            },
            failed: {
              type: 'integer',
              description: 'Number of failed syncs',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  shipmentId: {
                    type: 'string',
                  },
                  error: {
                    type: 'string',
                  },
                },
              },
            },
            duration: {
              type: 'integer',
              description: 'Sync duration in milliseconds',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
            },
            details: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      '/shipments': {
        get: {
          tags: ['Shipments'],
          summary: 'List all shipments',
          description: 'Retrieve a paginated list of shipments with optional filtering',
          parameters: [
            {
              name: 'status',
              in: 'query',
              description: 'Filter by shipment status',
              schema: {
                $ref: '#/components/schemas/ShipmentStatus',
              },
            },
            {
              name: 'page',
              in: 'query',
              description: 'Page number (default: 1)',
              schema: {
                type: 'integer',
                minimum: 1,
                default: 1,
              },
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Items per page (default: 20, max: 100)',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 20,
              },
            },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PaginatedShipments',
                  },
                },
              },
            },
            429: {
              description: 'Too many requests',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Shipments'],
          summary: 'Create a new shipment',
          description: 'Create a new shipment and register it with the carrier',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateShipment',
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Shipment created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/Shipment',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ValidationError',
                  },
                },
              },
            },
            409: {
              description: 'Conflict - Order ID already exists',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/shipments/{id}': {
        get: {
          tags: ['Shipments'],
          summary: 'Get a shipment by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Shipment UUID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            200: {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/Shipment',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid UUID format',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ValidationError',
                  },
                },
              },
            },
            404: {
              description: 'Shipment not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        patch: {
          tags: ['Shipments'],
          summary: 'Update a shipment',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Shipment UUID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateShipment',
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Shipment updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/Shipment',
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Shipment not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Shipments'],
          summary: 'Delete a shipment',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Shipment UUID',
              schema: {
                type: 'string',
                format: 'uuid',
              },
            },
          ],
          responses: {
            204: {
              description: 'Shipment deleted successfully',
            },
            404: {
              description: 'Shipment not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/sync': {
        post: {
          tags: ['Sync'],
          summary: 'Trigger synchronization',
          description: 'Sync all shipments or a specific shipment with the carrier',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shipmentId: {
                      type: 'string',
                      format: 'uuid',
                      description: 'Optional - sync only this shipment',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Sync completed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/SyncResult',
                      },
                    },
                  },
                },
              },
            },
            409: {
              description: 'Sync already in progress',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            429: {
              description: 'Too many sync requests',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We're defining everything inline
};

export const swaggerSpec = swaggerJsdoc(options);
