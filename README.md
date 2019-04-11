
# binary-parser

[![Greenkeeper badge](https://badges.greenkeeper.io/GMOD/binary-parser.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.com/GMOD/binary-parser.svg?branch=master)](https://travis-ci.com/GMOD/binary-parser)
[![codecov](https://codecov.io/gh/GMOD/binary-parser/branch/master/graph/badge.svg)](https://codecov.io/gh/GMOD/binary-parser)


@gmod/binary-parser is a fork of https://github.com/keichi/binary-parser that also handles 64-bit longs and itf8 and ltf8 types

## Installation

Binary-parser can be installed with [npm](https://npmjs.org/):

```shell
$ npm install @gmod/binary-parser
```

Important! Default this library is default little endian instead instead of big endian while https://github.com/keichi/binary-parser is default big endian

Example of reading a 64-bit int

    .uint64('mylong64bitint')
    .int64('mylong64bitint')

64 bit infers from the endianess of the .endianess, doesn't use uint64le/be

Verification of whether it is valid 2^53 max int is not done for 64 bit either
