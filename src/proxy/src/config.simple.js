module.exports = {
  urls: {
    url: 'http://example.com/path', // 通过URL参数key=url获取
    group1: {
      link1: 'http://example1.com/path/to' // 通过URL参数key=gruop1.link1获取
    }
  },
  cache: {
    redis: {},
    cos: {}
  }
};
