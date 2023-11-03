export default function select(selected, options) {
  const findOptionValue = new RegExp(' value="' + selected + '"')
  return options.fn(this).replace(findOptionValue, '$& selected="selected"')
}
