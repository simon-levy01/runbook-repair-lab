import {repairReview} from './repairReview'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Runbook Repair Lab',

  projectId: 'ipp6nys2',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), repairReview()],
  document: {actions: (prev, context) => (context.schemaType === 'repairProposal' ? [] : prev)},

  schema: {
    types: schemaTypes,
    templates: (prev) => prev.filter((template) => template.schemaType !== 'repairProposal'),
  },
})
