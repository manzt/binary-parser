var assert = require("assert");
var Parser = require("../dist/binary_parser").Parser;

const suite = (Buffer) =>
  describe(`Primitive parser (${Buffer.name})`, function () {
    function hexToBuf(hex) {
      return Buffer.from(
        hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );
    }
    describe("Primitive parsers", function () {
      it("should nothing", function () {
        var parser = Parser.start();

        var buffer = Buffer.from([0xa, 0x14, 0x1e, 0x28, 0x32]);
        assert.deepStrictEqual(parser.parse(buffer), {});
      });
      it("should parse integer types", function () {
        var parser = Parser.start().uint8("a").int16le("b").uint32be("c");

        var buffer = Buffer.from([0x00, 0xd2, 0x04, 0x00, 0xbc, 0x61, 0x4e]);
        assert.deepStrictEqual(parser.parse(buffer), {
          a: 0,
          b: 1234,
          c: 12345678,
        });
      });
      describe("BigInt64 parsers", () => {
        const [major] = process.version.replace("v", "").split(".");
        if (Number(major) >= 12) {
          it("should parse biguints64", () => {
            const parser = Parser.start().uint64be("a").uint64le("b");
            // from https://nodejs.org/api/buffer.html#buffer_buf_readbiguint64le_offset
            const buf = Buffer.from([
              0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00,
              0x00, 0xff, 0xff, 0xff, 0xff,
            ]);
            assert.deepStrictEqual(parser.parse(buf), {
              a: BigInt("4294967295"),
              b: BigInt("18446744069414584320"),
            });
          });

          it("should parse bigints64", () => {
            const parser = Parser.start()
              .int64be("a")
              .int64le("b")
              .int64be("c")
              .int64le("d");
            // from https://nodejs.org/api/buffer.html#buffer_buf_readbiguint64le_offset
            const buf = Buffer.from([
              0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x01, 0x00, 0x00,
              0x00, 0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff,
              0xff, 0xff, 0x01, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
            ]);
            assert.deepStrictEqual(parser.parse(buf), {
              a: BigInt("4294967295"),
              b: BigInt("-4294967295"),
              c: BigInt("4294967295"),
              d: BigInt("-4294967295"),
            });
          });
        } else {
          it("should throw when run under not v12", () => {
            assert.throws(() => Parser.start().bigint64("a"));
          });
        }
      });
      it("should use formatter to transform parsed integer", function () {
        var parser = Parser.start()
          .uint8("a", {
            formatter: function (val) {
              return val * 2;
            },
          })
          .int16le("b", {
            formatter: function (val) {
              return "test" + String(val);
            },
          });

        var buffer = Buffer.from([0x01, 0xd2, 0x04]);
        assert.deepStrictEqual(parser.parse(buffer), { a: 2, b: "test1234" });
      });
      it("should parse floating point types", function () {
        var parser = Parser.start().floatbe("a").doublele("b");

        var FLT_EPSILON = 0.00001;
        var buffer = Buffer.from([
          0x41, 0x45, 0x85, 0x1f, 0x7a, 0x36, 0xab, 0x3e, 0x57, 0x5b, 0xb1,
          0xbf,
        ]);
        var result = parser.parse(buffer);

        assert(Math.abs(result.a - 12.345) < FLT_EPSILON);
        assert(Math.abs(result.b - -0.0678) < FLT_EPSILON);
      });
      it("should handle endianess", function () {
        var parser = Parser.start().int32le("little").int32be("big");

        var buffer = Buffer.from([
          0x4e, 0x61, 0xbc, 0x00, 0x00, 0xbc, 0x61, 0x4e,
        ]);
        assert.deepStrictEqual(parser.parse(buffer), {
          little: 12345678,
          big: 12345678,
        });
      });
      it("should seek offset", function () {
        var parser = Parser.start()
          .uint8("a")
          .seek(3)
          .uint16le("b")
          .uint32be("c");

        var buffer = Buffer.from([
          0x00, 0xff, 0xff, 0xfe, 0xd2, 0x04, 0x00, 0xbc, 0x61, 0x4e,
        ]);
        assert.deepStrictEqual(parser.parse(buffer), {
          a: 0,
          b: 1234,
          c: 12345678,
        });
      });
    });

    describe("Bit field parsers", function () {
      var binaryLiteral = function (s) {
        var i;
        var bytes = [];

        s = s.replace(/\s/g, "");
        for (i = 0; i < s.length; i += 8) {
          bytes.push(parseInt(s.slice(i, i + 8), 2));
        }

        return Buffer.from(bytes);
      };

      it("binary literal helper should work", function () {
        assert.deepStrictEqual(binaryLiteral("11110000"), Buffer.from([0xf0]));
        assert.deepStrictEqual(
          binaryLiteral("11110000 10100101"),
          Buffer.from([0xf0, 0xa5])
        );
      });

      it("should parse 1-byte-length bit field sequence", function () {
        var parser = new Parser().bit1("a").bit2("b").bit4("c").bit1("d");

        var buf = binaryLiteral("1 10 1010 0");
        assert.deepStrictEqual(parser.parse(buf), {
          a: 1,
          b: 2,
          c: 10,
          d: 0,
        });

        parser = new Parser()
          .endianess("little")
          .bit1("a")
          .bit2("b")
          .bit4("c")
          .bit1("d");

        assert.deepStrictEqual(parser.parse(buf), {
          a: 0,
          b: 2,
          c: 10,
          d: 1,
        });
      });
      it("should parse 2-byte-length bit field sequence", function () {
        var parser = new Parser().bit3("a").bit9("b").bit4("c");

        var buf = binaryLiteral("101 111000111 0111");
        assert.deepStrictEqual(parser.parse(buf), {
          a: 5,
          b: 455,
          c: 7,
        });

        parser = new Parser().endianess("little").bit3("a").bit9("b").bit4("c");
        assert.deepStrictEqual(parser.parse(buf), {
          a: 7,
          b: 398,
          c: 11,
        });
      });
      it("should parse 4-byte-length bit field sequence", function () {
        var parser = new Parser()
          .bit1("a")
          .bit24("b")
          .bit4("c")
          .bit2("d")
          .bit1("e");
        var buf = binaryLiteral("1 101010101010101010101010 1111 01 1");
        assert.deepStrictEqual(parser.parse(buf), {
          a: 1,
          b: 11184810,
          c: 15,
          d: 1,
          e: 1,
        });

        parser = new Parser()
          .endianess("little")
          .bit1("a")
          .bit24("b")
          .bit4("c")
          .bit2("d")
          .bit1("e");
        assert.deepStrictEqual(parser.parse(buf), {
          a: 1,
          b: 11184829,
          c: 10,
          d: 2,
          e: 1,
        });
      });
      it("should parse nested bit fields", function () {
        var parser = new Parser().bit1("a").nest("x", {
          type: new Parser().bit2("b").bit4("c").bit1("d"),
        });

        var buf = binaryLiteral("11010100");

        assert.deepStrictEqual(parser.parse(buf), {
          a: 1,
          x: {
            b: 2,
            c: 10,
            d: 0,
          },
        });
      });
    });

    describe("String parser", function () {
      it("should parse UTF8 encoded string (ASCII only)", function () {
        var text = "hello, world";
        var buffer = Buffer.from(new TextEncoder().encode(text));
        var parser = Parser.start().string("msg", {
          length: buffer.length,
          encoding: "utf8",
        });

        assert.strictEqual(parser.parse(buffer).msg, text);
      });
      it("should parse UTF8 encoded string", function () {
        var text = "こんにちは、せかい。";
        var buffer = Buffer.from(new TextEncoder().encode(text));
        var parser = Parser.start().string("msg", {
          length: buffer.length,
          encoding: "utf8",
        });

        assert.strictEqual(parser.parse(buffer).msg, text);
      });
      it("should parse HEX encoded string", function () {
        var text = "cafebabe";
        var buffer = hexToBuf(text);
        var parser = Parser.start().string("msg", {
          length: buffer.length,
          encoding: "hex",
        });

        assert.strictEqual(parser.parse(buffer).msg, text);
      });
      it("should parse variable length string", function () {
        var buffer = hexToBuf("0c68656c6c6f2c20776f726c64");
        var parser = Parser.start()
          .uint8("length")
          .string("msg", { length: "length", encoding: "utf8" });

        assert.strictEqual(parser.parse(buffer).msg, "hello, world");
      });
      it("should parse zero terminated string", function () {
        var buffer = hexToBuf("68656c6c6f2c20776f726c6400");
        var parser = Parser.start().string("msg", {
          zeroTerminated: true,
          encoding: "utf8",
        });

        assert.deepStrictEqual(parser.parse(buffer), { msg: "hello, world" });
      });
      it("should parser zero terminated fixed-length string", function () {
        var buffer = Buffer.from(
          new TextEncoder().encode("abc\u0000defghij\u0000")
        );
        var parser = Parser.start()
          .string("a", { length: 5, zeroTerminated: true })
          .string("b", { length: 5, zeroTerminated: true })
          .string("c", { length: 5, zeroTerminated: true });

        assert.deepStrictEqual(parser.parse(buffer), {
          a: "abc",
          b: "defgh",
          c: "ij",
        });
      });
      it("should strip trailing null characters", function () {
        var buffer = hexToBuf("746573740000");
        var parser1 = Parser.start().string("str", {
          length: 7,
          stripNull: false,
        });
        var parser2 = Parser.start().string("str", {
          length: 7,
          stripNull: true,
        });

        assert.strictEqual(parser1.parse(buffer).str, "test\u0000\u0000");
        assert.strictEqual(parser2.parse(buffer).str, "test");
      });
      it("should parse string greedily with zero-bytes internally", function () {
        var buffer = Buffer.from(
          new TextEncoder().encode("abc\u0000defghij\u0000")
        );
        var parser = Parser.start().string("a", { greedy: true });

        assert.deepStrictEqual(parser.parse(buffer), {
          a: "abc\u0000defghij\u0000",
        });
      });
    });

    describe("Buffer parser", function () {
      it("should parse as buffer", function () {
        var parser = new Parser().uint8("len").buffer("raw", {
          length: "len",
        });

        var buf = hexToBuf("deadbeefdeadbeef");
        var result = parser.parse(Buffer.from([...Buffer.from([8]), ...buf]));

        assert.deepStrictEqual(result.raw, buf);
      });

      it("should clone buffer if options.clone is true", function () {
        var parser = new Parser().buffer("raw", {
          length: 8,
          clone: true,
        });

        var buf = hexToBuf("deadbeefdeadbeef");
        var result = parser.parse(buf);
        assert.deepStrictEqual(result.raw, buf);
        result.raw[0] = 0xff;
        assert.notDeepStrictEqual(result.raw, buf);
      });

      it("should parse until function returns true when readUntil is function", function () {
        var parser = new Parser()
          .endianess("big")
          .uint8("cmd")
          .buffer("data", {
            readUntil: function (item) {
              return item === 2;
            },
          });

        var result = parser.parse(hexToBuf("aa"));
        assert.deepStrictEqual(result, { cmd: 0xaa, data: Buffer.from([]) });

        var result = parser.parse(hexToBuf("aabbcc"));
        assert.deepStrictEqual(result, { cmd: 0xaa, data: hexToBuf("bbcc") });

        var result = parser.parse(hexToBuf("aa02bbcc"));
        assert.deepStrictEqual(result, { cmd: 0xaa, data: Buffer.from([]) });

        var result = parser.parse(hexToBuf("aabbcc02"));
        assert.deepStrictEqual(result, { cmd: 0xaa, data: hexToBuf("bbcc") });

        var result = parser.parse(hexToBuf("aabbcc02dd"));
        assert.deepStrictEqual(result, { cmd: 0xaa, data: hexToBuf("bbcc") });
      });

      // this is a test for testing a fix of a bug, that removed the last byte
      // of the buffer parser
      it("should return a buffer with same size", function () {
        var bufferParser = new Parser().buffer("buf", {
          readUntil: "eof",
          formatter: function (buffer) {
            return buffer;
          },
        });

        var buffer = Buffer.from("John\0Doe\0");
        assert.deepStrictEqual(bufferParser.parse(buffer), { buf: buffer });
      });
    });
  });

suite(Buffer);
suite(Uint8Array);
