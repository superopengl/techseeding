export const BusinessDef = [
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
    label: 'Name',
    name: 'title',
    rules: [
      {
        required: true,
        message: 'Please input business name'
      }
    ],
    inputProps: {
      placeholder: 'Business name',
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
        required: true,
        message: 'Please input business description'
      }
    ],
    inputProps: {
      placeholder: 'Business description',
      maxLength: 300,
      autoSize: true,
      allowClear: true
    }
  },
  {
    label: 'Group',
    name: 'group',
    type: 'enum',
    rules: [
      {
        required: true,
        message: 'Please input business group'
      }
    ],
    inputProps: {
      options: [
        {value: 'top', label: 'Top Business'},
        {value: 'new', label: 'New Business'},
        {value: 'life', label: 'Life'},
        {value: 'auto', label: 'Auto'},
        {value: 'restaurant', label: 'Restaurant'},
      ]
    }
  },
  {
    label: 'Website',
    name: 'website',
    rules: [
      {
        required: false,
        type: 'url'
      }
    ],
    inputProps: {
      placeholder: 'https://',
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