
# binary-parser

[![Greenkeeper badge](https://badges.greenkeeper.io/GMOD/binary-parser.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.com/GMOD/binary-parser.svg?branch=master)](https://travis-ci.com/GMOD/binary-parser)

@gmod/binary-parser is a fork of https://github.com/keichi/binary-parser that also handles 64-bit longs and itf8 and ltf8 types

## Installation

Binary-parser can be installed with [npm](https://npmjs.org/):

```shell
$ npm install @gmod/binary-parser
```

Important! Default this library is default little endian instead instead of big endian while https://github.com/keichi/binary-parser is default big endian

Example of reading a 64-bit int

    .buffer('mylong64bitint', { length: 8, formatter: function(buf) { return Long.fromBytes(buf, true, this.endian==='le').toNumber() } })

