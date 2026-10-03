import {defineType, defineField, defineArrayMember} from 'sanity'
const requiredText = (name: string, title?: string) =>
  defineField({name, title, type: 'string', validation: (r) => r.required().max(2000)})
const capabilities = (name: string) =>
  defineField({
    name,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'string',
        validation: (r) => r.required().regex(/^[a-z][a-z0-9-]*$/),
      }),
    ],
    validation: (r) => r.required().unique(),
  })
const toolReference = defineField({
  name: 'tool',
  type: 'reference',
  to: [{type: 'tool'}],
  validation: (r) => r.required(),
})
const major = (name: string) =>
  defineField({name, type: 'number', validation: (r) => r.required().integer().min(1).max(100)})
export const tool = defineType({
  name: 'tool',
  title: 'Fictional tool',
  type: 'document',
  fields: [
    requiredText('title'),
    defineField({
      name: 'releases',
      description:
        'Published fictional major releases. The checker does not infer semver compatibility.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'number',
          validation: (r) => r.required().integer().min(1).max(100),
        }),
      ],
      validation: (r) => r.required().min(1).unique(),
    }),
  ],
})
export const prerequisite = defineType({
  name: 'prerequisite',
  type: 'document',
  fields: [
    requiredText('title'),
    requiredText('detail'),
    defineField({
      name: 'capability',
      type: 'string',
      validation: (r) => r.required().regex(/^[a-z][a-z0-9-]*$/),
    }),
  ],
})
export const guide = defineType({
  name: 'guide',
  type: 'document',
  fields: [
    requiredText('title'),
    requiredText('summary'),
    defineField({
      name: 'difficulty',
      type: 'string',
      options: {list: ['Starter', 'Intermediate']},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'prerequisites',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'prerequisite'}]})],
      validation: (r) => r.required().unique(),
    }),
    defineField({
      name: 'defaults',
      title: 'Published starting tool versions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'toolDefault',
          fields: [toolReference, major('version')],
          preview: {select: {title: 'tool.title', subtitle: 'version'}},
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'steps',
      type: 'array',
      validation: (r) => r.required().min(1).max(20),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'guideStep',
          fields: [
            requiredText('title'),
            requiredText('detail'),
            defineField({
              name: 'example',
              title: 'Inert fictional command example',
              type: 'string',
              description: 'Display text only. Never executable.',
              validation: (r) => r.required().max(2000),
            }),
            capabilities('needs'),
            capabilities('gives'),
            defineField({
              name: 'tools',
              type: 'array',
              validation: (r) => r.required(),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'toolRequirement',
                  fields: [
                    toolReference,
                    major('min'),
                    defineField({
                      name: 'max',
                      type: 'number',
                      validation: (r) => r.required().integer().min(r.valueOfField('min')).max(100),
                    }),
                  ],
                  preview: {select: {title: 'tool.title', subtitle: 'min'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'detail'}},
        }),
      ],
    }),
  ],
})
export const schemaTypes = [tool, prerequisite, guide]
