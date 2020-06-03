import { string, number } from "prop-types";

export const GalleryDef = [
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
        required: false
      }
    ],
    inputProps: {
      placeholder: 'Picture title',
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
        required: false
      }
    ],
    inputProps: {
      placeholder: 'Picture description',
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
      placeholder: 'A number used for sorting pictures in the gallery',
      min: 0
    }
  },
]