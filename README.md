
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

## Special data types

The ITF-8 and LTF-8 types documented in https://samtools.github.io/hts-specs/CRAMv3.pdf

```
ITF-8 integer (itf8)
This is an alternative way to write an integer value. The idea is similar to UTF-8 encoding and therefore
this encoding is called ITF-8 (Integer Transformation Format - 8 bit).
The most significant bits of the first byte have special meaning and are called ‘prefix’. These are 0 to 4
true bits followed by a 0. The number of 1’s denote the number of bytes to follow. To accommodate 32
bits such representation requires 5 bytes with only 4 lower bits used in the last byte 5.

LTF-8 long (ltf8)
See ITF-8 for more details. The only difference between ITF-8 and LTF-8 is the number of bytes used to
encode a single value. To do so 64 bits are required and this can be done with 9 byte at most with the
first byte consisting of just 1s or 0xFF value.
```

The 64-bit parsing in this library is done by https://www.npmjs.com/package/long and simply returns .toNumber() on the parsed 64 bit data

## Differences with keichi/binary-parser


* This library is default little endian instead instead of big endian while https://github.com/keichi/binary-parser is default big endian

* The return value of the parse {result: <parsed results>,offset: <number of bytes parsed>}


## Example usage

Example of reading a 64-bit int

    new Parser()
    .uint64('mylong64bitint')
    .int64('mylong64bitint')

64 bit infers from the endianess of the .endianess, doesn't use uint64le/be

Verification of whether the long is a valid 2^53 int is not done for 64 bit numbers. If you require this make a custom callback using Long in a formatter for buffer
