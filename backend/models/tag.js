const Tag = Object.freeze({
  ARRAYS: 'Arrays',
  TREES: 'Trees',
  GRAPHS: 'Graphs',
  DYNAMIC_PROGRAMMING: 'Dynamic Programming',
});

export const getAllTags = () => Object.values(Tag);

export default Tag;
