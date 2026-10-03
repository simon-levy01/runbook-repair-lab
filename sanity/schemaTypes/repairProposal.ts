import {defineType, defineField} from 'sanity'
export const repairProposal = defineType({
  name: 'repairProposal',
  title: 'Repair proposal',
  type: 'document',
  description: 'Owner-reviewed fictional repair conditions. Review using the Repair review tool.',
  fields: [
    defineField({name: 'title', type: 'string', readOnly: true}),
    defineField({name: 'guide', type: 'reference', to: [{type: 'guide'}], readOnly: true}),
    defineField({name: 'fingerprint', type: 'string', readOnly: true}),
    defineField({
      name: 'status',
      type: 'string',
      options: {list: ['pending', 'approved', 'rejected']},
      readOnly: true,
    }),
    defineField({
      name: 'experiment',
      type: 'object',
      readOnly: true,
      fields: [
        defineField({name: 'prerequisites', type: 'array', of: [{type: 'string'}]}),
        defineField({name: 'disabled', type: 'array', of: [{type: 'string'}]}),
        // Structured references and explicit versions; no arbitrary JSON field.
        defineField({
          name: 'versions',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'repairVersion',
              fields: [
                {name: 'tool', type: 'reference', to: [{type: 'tool'}]},
                {name: 'version', type: 'number'},
              ],
            },
          ],
        }),
      ],
    }),
    defineField({name: 'createdAt', type: 'datetime', readOnly: true}),
    defineField({name: 'reviewedAt', type: 'datetime', readOnly: true}),
  ],
  preview: {select: {title: 'title', subtitle: 'status'}},
})
