import { string, number } from "prop-types";

export const PosterDef = [
  {
    label: 'Picture',
    name: 'imageId',
    type: 'uploader',
    rules: [
      {
        required: true,
        message: 'Please upload image'
      }
    ]
  },
  {
    label: 'Title',
    name: 'title',
    rules: [
      {
        required: true,
        message: 'Please input event title'
      }
    ],
    inputProps: {
      placeholder: 'Event title',
      maxLength: 100,
      allowClear: true
    }
  },
  {
    label: 'Description',
    name: 'description',
    type: 'textarea',
    rules: [
      {
        required: false,
        message: 'Please input event description'
      }
    ],
    inputProps: {
      placeholder: 'Event description',
      maxLength: 300,
      autoSize: true,
      allowClear: true
    }
  },
  {
    label: 'Ordinal',
    name: 'ordinal',
    type: 'number',
    rules: [
      {
        required: false,
        type: 'number'
      }
    ],
    inputProps: {
      placeholder: 'A number used for sorting events on the home page',
      min: 0
    }
  },
]