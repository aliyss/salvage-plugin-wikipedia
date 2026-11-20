// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/jpeg-js/lib/encoder.js
var require_encoder = __commonJS((exports, module) => {
  var btoa = btoa || function(buf) {
    return Buffer.from(buf).toString("base64");
  };
  function JPEGEncoder(quality) {
    var self = this;
    var fround = Math.round;
    var ffloor = Math.floor;
    var YTable = new Array(64);
    var UVTable = new Array(64);
    var fdtbl_Y = new Array(64);
    var fdtbl_UV = new Array(64);
    var YDC_HT;
    var UVDC_HT;
    var YAC_HT;
    var UVAC_HT;
    var bitcode = new Array(65535);
    var category = new Array(65535);
    var outputfDCTQuant = new Array(64);
    var DU = new Array(64);
    var byteout = [];
    var bytenew = 0;
    var bytepos = 7;
    var YDU = new Array(64);
    var UDU = new Array(64);
    var VDU = new Array(64);
    var clt = new Array(256);
    var RGB_YUV_TABLE = new Array(2048);
    var currentQuality;
    var ZigZag = [
      0,
      1,
      5,
      6,
      14,
      15,
      27,
      28,
      2,
      4,
      7,
      13,
      16,
      26,
      29,
      42,
      3,
      8,
      12,
      17,
      25,
      30,
      41,
      43,
      9,
      11,
      18,
      24,
      31,
      40,
      44,
      53,
      10,
      19,
      23,
      32,
      39,
      45,
      52,
      54,
      20,
      22,
      33,
      38,
      46,
      51,
      55,
      60,
      21,
      34,
      37,
      47,
      50,
      56,
      59,
      61,
      35,
      36,
      48,
      49,
      57,
      58,
      62,
      63
    ];
    var std_dc_luminance_nrcodes = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
    var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var std_ac_luminance_nrcodes = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125];
    var std_ac_luminance_values = [
      1,
      2,
      3,
      0,
      4,
      17,
      5,
      18,
      33,
      49,
      65,
      6,
      19,
      81,
      97,
      7,
      34,
      113,
      20,
      50,
      129,
      145,
      161,
      8,
      35,
      66,
      177,
      193,
      21,
      82,
      209,
      240,
      36,
      51,
      98,
      114,
      130,
      9,
      10,
      22,
      23,
      24,
      25,
      26,
      37,
      38,
      39,
      40,
      41,
      42,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      67,
      68,
      69,
      70,
      71,
      72,
      73,
      74,
      83,
      84,
      85,
      86,
      87,
      88,
      89,
      90,
      99,
      100,
      101,
      102,
      103,
      104,
      105,
      106,
      115,
      116,
      117,
      118,
      119,
      120,
      121,
      122,
      131,
      132,
      133,
      134,
      135,
      136,
      137,
      138,
      146,
      147,
      148,
      149,
      150,
      151,
      152,
      153,
      154,
      162,
      163,
      164,
      165,
      166,
      167,
      168,
      169,
      170,
      178,
      179,
      180,
      181,
      182,
      183,
      184,
      185,
      186,
      194,
      195,
      196,
      197,
      198,
      199,
      200,
      201,
      202,
      210,
      211,
      212,
      213,
      214,
      215,
      216,
      217,
      218,
      225,
      226,
      227,
      228,
      229,
      230,
      231,
      232,
      233,
      234,
      241,
      242,
      243,
      244,
      245,
      246,
      247,
      248,
      249,
      250
    ];
    var std_dc_chrominance_nrcodes = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
    var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var std_ac_chrominance_nrcodes = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119];
    var std_ac_chrominance_values = [
      0,
      1,
      2,
      3,
      17,
      4,
      5,
      33,
      49,
      6,
      18,
      65,
      81,
      7,
      97,
      113,
      19,
      34,
      50,
      129,
      8,
      20,
      66,
      145,
      161,
      177,
      193,
      9,
      35,
      51,
      82,
      240,
      21,
      98,
      114,
      209,
      10,
      22,
      36,
      52,
      225,
      37,
      241,
      23,
      24,
      25,
      26,
      38,
      39,
      40,
      41,
      42,
      53,
      54,
      55,
      56,
      57,
      58,
      67,
      68,
      69,
      70,
      71,
      72,
      73,
      74,
      83,
      84,
      85,
      86,
      87,
      88,
      89,
      90,
      99,
      100,
      101,
      102,
      103,
      104,
      105,
      106,
      115,
      116,
      117,
      118,
      119,
      120,
      121,
      122,
      130,
      131,
      132,
      133,
      134,
      135,
      136,
      137,
      138,
      146,
      147,
      148,
      149,
      150,
      151,
      152,
      153,
      154,
      162,
      163,
      164,
      165,
      166,
      167,
      168,
      169,
      170,
      178,
      179,
      180,
      181,
      182,
      183,
      184,
      185,
      186,
      194,
      195,
      196,
      197,
      198,
      199,
      200,
      201,
      202,
      210,
      211,
      212,
      213,
      214,
      215,
      216,
      217,
      218,
      226,
      227,
      228,
      229,
      230,
      231,
      232,
      233,
      234,
      242,
      243,
      244,
      245,
      246,
      247,
      248,
      249,
      250
    ];
    function initQuantTables(sf) {
      var YQT = [
        16,
        11,
        10,
        16,
        24,
        40,
        51,
        61,
        12,
        12,
        14,
        19,
        26,
        58,
        60,
        55,
        14,
        13,
        16,
        24,
        40,
        57,
        69,
        56,
        14,
        17,
        22,
        29,
        51,
        87,
        80,
        62,
        18,
        22,
        37,
        56,
        68,
        109,
        103,
        77,
        24,
        35,
        55,
        64,
        81,
        104,
        113,
        92,
        49,
        64,
        78,
        87,
        103,
        121,
        120,
        101,
        72,
        92,
        95,
        98,
        112,
        100,
        103,
        99
      ];
      for (var i = 0;i < 64; i++) {
        var t = ffloor((YQT[i] * sf + 50) / 100);
        if (t < 1) {
          t = 1;
        } else if (t > 255) {
          t = 255;
        }
        YTable[ZigZag[i]] = t;
      }
      var UVQT = [
        17,
        18,
        24,
        47,
        99,
        99,
        99,
        99,
        18,
        21,
        26,
        66,
        99,
        99,
        99,
        99,
        24,
        26,
        56,
        99,
        99,
        99,
        99,
        99,
        47,
        66,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99
      ];
      for (var j = 0;j < 64; j++) {
        var u = ffloor((UVQT[j] * sf + 50) / 100);
        if (u < 1) {
          u = 1;
        } else if (u > 255) {
          u = 255;
        }
        UVTable[ZigZag[j]] = u;
      }
      var aasf = [
        1,
        1.387039845,
        1.306562965,
        1.175875602,
        1,
        0.785694958,
        0.5411961,
        0.275899379
      ];
      var k = 0;
      for (var row = 0;row < 8; row++) {
        for (var col = 0;col < 8; col++) {
          fdtbl_Y[k] = 1 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8);
          fdtbl_UV[k] = 1 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8);
          k++;
        }
      }
    }
    function computeHuffmanTbl(nrcodes, std_table) {
      var codevalue = 0;
      var pos_in_table = 0;
      var HT = new Array;
      for (var k = 1;k <= 16; k++) {
        for (var j = 1;j <= nrcodes[k]; j++) {
          HT[std_table[pos_in_table]] = [];
          HT[std_table[pos_in_table]][0] = codevalue;
          HT[std_table[pos_in_table]][1] = k;
          pos_in_table++;
          codevalue++;
        }
        codevalue *= 2;
      }
      return HT;
    }
    function initHuffmanTbl() {
      YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes, std_dc_luminance_values);
      UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes, std_dc_chrominance_values);
      YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes, std_ac_luminance_values);
      UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes, std_ac_chrominance_values);
    }
    function initCategoryNumber() {
      var nrlower = 1;
      var nrupper = 2;
      for (var cat = 1;cat <= 15; cat++) {
        for (var nr = nrlower;nr < nrupper; nr++) {
          category[32767 + nr] = cat;
          bitcode[32767 + nr] = [];
          bitcode[32767 + nr][1] = cat;
          bitcode[32767 + nr][0] = nr;
        }
        for (var nrneg = -(nrupper - 1);nrneg <= -nrlower; nrneg++) {
          category[32767 + nrneg] = cat;
          bitcode[32767 + nrneg] = [];
          bitcode[32767 + nrneg][1] = cat;
          bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg;
        }
        nrlower <<= 1;
        nrupper <<= 1;
      }
    }
    function initRGBYUVTable() {
      for (var i = 0;i < 256; i++) {
        RGB_YUV_TABLE[i] = 19595 * i;
        RGB_YUV_TABLE[i + 256 >> 0] = 38470 * i;
        RGB_YUV_TABLE[i + 512 >> 0] = 7471 * i + 32768;
        RGB_YUV_TABLE[i + 768 >> 0] = -11059 * i;
        RGB_YUV_TABLE[i + 1024 >> 0] = -21709 * i;
        RGB_YUV_TABLE[i + 1280 >> 0] = 32768 * i + 8421375;
        RGB_YUV_TABLE[i + 1536 >> 0] = -27439 * i;
        RGB_YUV_TABLE[i + 1792 >> 0] = -5329 * i;
      }
    }
    function writeBits(bs) {
      var value = bs[0];
      var posval = bs[1] - 1;
      while (posval >= 0) {
        if (value & 1 << posval) {
          bytenew |= 1 << bytepos;
        }
        posval--;
        bytepos--;
        if (bytepos < 0) {
          if (bytenew == 255) {
            writeByte(255);
            writeByte(0);
          } else {
            writeByte(bytenew);
          }
          bytepos = 7;
          bytenew = 0;
        }
      }
    }
    function writeByte(value) {
      byteout.push(value);
    }
    function writeWord(value) {
      writeByte(value >> 8 & 255);
      writeByte(value & 255);
    }
    function fDCTQuant(data, fdtbl) {
      var d0, d1, d2, d3, d4, d5, d6, d7;
      var dataOff = 0;
      var i;
      var I8 = 8;
      var I64 = 64;
      for (i = 0;i < I8; ++i) {
        d0 = data[dataOff];
        d1 = data[dataOff + 1];
        d2 = data[dataOff + 2];
        d3 = data[dataOff + 3];
        d4 = data[dataOff + 4];
        d5 = data[dataOff + 5];
        d6 = data[dataOff + 6];
        d7 = data[dataOff + 7];
        var tmp0 = d0 + d7;
        var tmp7 = d0 - d7;
        var tmp1 = d1 + d6;
        var tmp6 = d1 - d6;
        var tmp2 = d2 + d5;
        var tmp5 = d2 - d5;
        var tmp3 = d3 + d4;
        var tmp4 = d3 - d4;
        var tmp10 = tmp0 + tmp3;
        var tmp13 = tmp0 - tmp3;
        var tmp11 = tmp1 + tmp2;
        var tmp12 = tmp1 - tmp2;
        data[dataOff] = tmp10 + tmp11;
        data[dataOff + 4] = tmp10 - tmp11;
        var z1 = (tmp12 + tmp13) * 0.707106781;
        data[dataOff + 2] = tmp13 + z1;
        data[dataOff + 6] = tmp13 - z1;
        tmp10 = tmp4 + tmp5;
        tmp11 = tmp5 + tmp6;
        tmp12 = tmp6 + tmp7;
        var z5 = (tmp10 - tmp12) * 0.382683433;
        var z2 = 0.5411961 * tmp10 + z5;
        var z4 = 1.306562965 * tmp12 + z5;
        var z3 = tmp11 * 0.707106781;
        var z11 = tmp7 + z3;
        var z13 = tmp7 - z3;
        data[dataOff + 5] = z13 + z2;
        data[dataOff + 3] = z13 - z2;
        data[dataOff + 1] = z11 + z4;
        data[dataOff + 7] = z11 - z4;
        dataOff += 8;
      }
      dataOff = 0;
      for (i = 0;i < I8; ++i) {
        d0 = data[dataOff];
        d1 = data[dataOff + 8];
        d2 = data[dataOff + 16];
        d3 = data[dataOff + 24];
        d4 = data[dataOff + 32];
        d5 = data[dataOff + 40];
        d6 = data[dataOff + 48];
        d7 = data[dataOff + 56];
        var tmp0p2 = d0 + d7;
        var tmp7p2 = d0 - d7;
        var tmp1p2 = d1 + d6;
        var tmp6p2 = d1 - d6;
        var tmp2p2 = d2 + d5;
        var tmp5p2 = d2 - d5;
        var tmp3p2 = d3 + d4;
        var tmp4p2 = d3 - d4;
        var tmp10p2 = tmp0p2 + tmp3p2;
        var tmp13p2 = tmp0p2 - tmp3p2;
        var tmp11p2 = tmp1p2 + tmp2p2;
        var tmp12p2 = tmp1p2 - tmp2p2;
        data[dataOff] = tmp10p2 + tmp11p2;
        data[dataOff + 32] = tmp10p2 - tmp11p2;
        var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781;
        data[dataOff + 16] = tmp13p2 + z1p2;
        data[dataOff + 48] = tmp13p2 - z1p2;
        tmp10p2 = tmp4p2 + tmp5p2;
        tmp11p2 = tmp5p2 + tmp6p2;
        tmp12p2 = tmp6p2 + tmp7p2;
        var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433;
        var z2p2 = 0.5411961 * tmp10p2 + z5p2;
        var z4p2 = 1.306562965 * tmp12p2 + z5p2;
        var z3p2 = tmp11p2 * 0.707106781;
        var z11p2 = tmp7p2 + z3p2;
        var z13p2 = tmp7p2 - z3p2;
        data[dataOff + 40] = z13p2 + z2p2;
        data[dataOff + 24] = z13p2 - z2p2;
        data[dataOff + 8] = z11p2 + z4p2;
        data[dataOff + 56] = z11p2 - z4p2;
        dataOff++;
      }
      var fDCTQuant2;
      for (i = 0;i < I64; ++i) {
        fDCTQuant2 = data[i] * fdtbl[i];
        outputfDCTQuant[i] = fDCTQuant2 > 0 ? fDCTQuant2 + 0.5 | 0 : fDCTQuant2 - 0.5 | 0;
      }
      return outputfDCTQuant;
    }
    function writeAPP0() {
      writeWord(65504);
      writeWord(16);
      writeByte(74);
      writeByte(70);
      writeByte(73);
      writeByte(70);
      writeByte(0);
      writeByte(1);
      writeByte(1);
      writeByte(0);
      writeWord(1);
      writeWord(1);
      writeByte(0);
      writeByte(0);
    }
    function writeAPP1(exifBuffer) {
      if (!exifBuffer)
        return;
      writeWord(65505);
      if (exifBuffer[0] === 69 && exifBuffer[1] === 120 && exifBuffer[2] === 105 && exifBuffer[3] === 102) {
        writeWord(exifBuffer.length + 2);
      } else {
        writeWord(exifBuffer.length + 5 + 2);
        writeByte(69);
        writeByte(120);
        writeByte(105);
        writeByte(102);
        writeByte(0);
      }
      for (var i = 0;i < exifBuffer.length; i++) {
        writeByte(exifBuffer[i]);
      }
    }
    function writeSOF0(width, height) {
      writeWord(65472);
      writeWord(17);
      writeByte(8);
      writeWord(height);
      writeWord(width);
      writeByte(3);
      writeByte(1);
      writeByte(17);
      writeByte(0);
      writeByte(2);
      writeByte(17);
      writeByte(1);
      writeByte(3);
      writeByte(17);
      writeByte(1);
    }
    function writeDQT() {
      writeWord(65499);
      writeWord(132);
      writeByte(0);
      for (var i = 0;i < 64; i++) {
        writeByte(YTable[i]);
      }
      writeByte(1);
      for (var j = 0;j < 64; j++) {
        writeByte(UVTable[j]);
      }
    }
    function writeDHT() {
      writeWord(65476);
      writeWord(418);
      writeByte(0);
      for (var i = 0;i < 16; i++) {
        writeByte(std_dc_luminance_nrcodes[i + 1]);
      }
      for (var j = 0;j <= 11; j++) {
        writeByte(std_dc_luminance_values[j]);
      }
      writeByte(16);
      for (var k = 0;k < 16; k++) {
        writeByte(std_ac_luminance_nrcodes[k + 1]);
      }
      for (var l = 0;l <= 161; l++) {
        writeByte(std_ac_luminance_values[l]);
      }
      writeByte(1);
      for (var m = 0;m < 16; m++) {
        writeByte(std_dc_chrominance_nrcodes[m + 1]);
      }
      for (var n = 0;n <= 11; n++) {
        writeByte(std_dc_chrominance_values[n]);
      }
      writeByte(17);
      for (var o = 0;o < 16; o++) {
        writeByte(std_ac_chrominance_nrcodes[o + 1]);
      }
      for (var p = 0;p <= 161; p++) {
        writeByte(std_ac_chrominance_values[p]);
      }
    }
    function writeCOM(comments) {
      if (typeof comments === "undefined" || comments.constructor !== Array)
        return;
      comments.forEach((e) => {
        if (typeof e !== "string")
          return;
        writeWord(65534);
        var l = e.length;
        writeWord(l + 2);
        var i;
        for (i = 0;i < l; i++)
          writeByte(e.charCodeAt(i));
      });
    }
    function writeSOS() {
      writeWord(65498);
      writeWord(12);
      writeByte(3);
      writeByte(1);
      writeByte(0);
      writeByte(2);
      writeByte(17);
      writeByte(3);
      writeByte(17);
      writeByte(0);
      writeByte(63);
      writeByte(0);
    }
    function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
      var EOB = HTAC[0];
      var M16zeroes = HTAC[240];
      var pos;
      var I16 = 16;
      var I63 = 63;
      var I64 = 64;
      var DU_DCT = fDCTQuant(CDU, fdtbl);
      for (var j = 0;j < I64; ++j) {
        DU[ZigZag[j]] = DU_DCT[j];
      }
      var Diff = DU[0] - DC;
      DC = DU[0];
      if (Diff == 0) {
        writeBits(HTDC[0]);
      } else {
        pos = 32767 + Diff;
        writeBits(HTDC[category[pos]]);
        writeBits(bitcode[pos]);
      }
      var end0pos = 63;
      for (;end0pos > 0 && DU[end0pos] == 0; end0pos--) {}
      if (end0pos == 0) {
        writeBits(EOB);
        return DC;
      }
      var i = 1;
      var lng;
      while (i <= end0pos) {
        var startpos = i;
        for (;DU[i] == 0 && i <= end0pos; ++i) {}
        var nrzeroes = i - startpos;
        if (nrzeroes >= I16) {
          lng = nrzeroes >> 4;
          for (var nrmarker = 1;nrmarker <= lng; ++nrmarker)
            writeBits(M16zeroes);
          nrzeroes = nrzeroes & 15;
        }
        pos = 32767 + DU[i];
        writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
        writeBits(bitcode[pos]);
        i++;
      }
      if (end0pos != I63) {
        writeBits(EOB);
      }
      return DC;
    }
    function initCharLookupTable() {
      var sfcc = String.fromCharCode;
      for (var i = 0;i < 256; i++) {
        clt[i] = sfcc(i);
      }
    }
    this.encode = function(image, quality2) {
      var time_start = new Date().getTime();
      if (quality2)
        setQuality(quality2);
      byteout = new Array;
      bytenew = 0;
      bytepos = 7;
      writeWord(65496);
      writeAPP0();
      writeCOM(image.comments);
      writeAPP1(image.exifBuffer);
      writeDQT();
      writeSOF0(image.width, image.height);
      writeDHT();
      writeSOS();
      var DCY = 0;
      var DCU = 0;
      var DCV = 0;
      bytenew = 0;
      bytepos = 7;
      this.encode.displayName = "_encode_";
      var imageData = image.data;
      var width = image.width;
      var height = image.height;
      var quadWidth = width * 4;
      var tripleWidth = width * 3;
      var x, y = 0;
      var r, g, b;
      var start, p, col, row, pos;
      while (y < height) {
        x = 0;
        while (x < quadWidth) {
          start = quadWidth * y + x;
          p = start;
          col = -1;
          row = 0;
          for (pos = 0;pos < 64; pos++) {
            row = pos >> 3;
            col = (pos & 7) * 4;
            p = start + row * quadWidth + col;
            if (y + row >= height) {
              p -= quadWidth * (y + 1 + row - height);
            }
            if (x + col >= quadWidth) {
              p -= x + col - quadWidth + 4;
            }
            r = imageData[p++];
            g = imageData[p++];
            b = imageData[p++];
            YDU[pos] = (RGB_YUV_TABLE[r] + RGB_YUV_TABLE[g + 256 >> 0] + RGB_YUV_TABLE[b + 512 >> 0] >> 16) - 128;
            UDU[pos] = (RGB_YUV_TABLE[r + 768 >> 0] + RGB_YUV_TABLE[g + 1024 >> 0] + RGB_YUV_TABLE[b + 1280 >> 0] >> 16) - 128;
            VDU[pos] = (RGB_YUV_TABLE[r + 1280 >> 0] + RGB_YUV_TABLE[g + 1536 >> 0] + RGB_YUV_TABLE[b + 1792 >> 0] >> 16) - 128;
          }
          DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
          DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
          DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
          x += 32;
        }
        y += 8;
      }
      if (bytepos >= 0) {
        var fillbits = [];
        fillbits[1] = bytepos + 1;
        fillbits[0] = (1 << bytepos + 1) - 1;
        writeBits(fillbits);
      }
      writeWord(65497);
      if (typeof module === "undefined")
        return new Uint8Array(byteout);
      return Buffer.from(byteout);
      var jpegDataUri = "data:image/jpeg;base64," + btoa(byteout.join(""));
      byteout = [];
      var duration = new Date().getTime() - time_start;
      return jpegDataUri;
    };
    function setQuality(quality2) {
      if (quality2 <= 0) {
        quality2 = 1;
      }
      if (quality2 > 100) {
        quality2 = 100;
      }
      if (currentQuality == quality2)
        return;
      var sf = 0;
      if (quality2 < 50) {
        sf = Math.floor(5000 / quality2);
      } else {
        sf = Math.floor(200 - quality2 * 2);
      }
      initQuantTables(sf);
      currentQuality = quality2;
    }
    function init() {
      var time_start = new Date().getTime();
      if (!quality)
        quality = 50;
      initCharLookupTable();
      initHuffmanTbl();
      initCategoryNumber();
      initRGBYUVTable();
      setQuality(quality);
      var duration = new Date().getTime() - time_start;
    }
    init();
  }
  if (typeof module !== "undefined") {
    module.exports = encode;
  } else if (typeof window !== "undefined") {
    window["jpeg-js"] = window["jpeg-js"] || {};
    window["jpeg-js"].encode = encode;
  }
  function encode(imgData, qu) {
    if (typeof qu === "undefined")
      qu = 50;
    var encoder = new JPEGEncoder(qu);
    var data = encoder.encode(imgData, qu);
    return {
      data,
      width: imgData.width,
      height: imgData.height
    };
  }
});

// node_modules/jpeg-js/lib/decoder.js
var require_decoder = __commonJS((exports, module) => {
  var JpegImage = function jpegImage() {
    var dctZigZag = new Int32Array([
      0,
      1,
      8,
      16,
      9,
      2,
      3,
      10,
      17,
      24,
      32,
      25,
      18,
      11,
      4,
      5,
      12,
      19,
      26,
      33,
      40,
      48,
      41,
      34,
      27,
      20,
      13,
      6,
      7,
      14,
      21,
      28,
      35,
      42,
      49,
      56,
      57,
      50,
      43,
      36,
      29,
      22,
      15,
      23,
      30,
      37,
      44,
      51,
      58,
      59,
      52,
      45,
      38,
      31,
      39,
      46,
      53,
      60,
      61,
      54,
      47,
      55,
      62,
      63
    ]);
    var dctCos1 = 4017;
    var dctSin1 = 799;
    var dctCos3 = 3406;
    var dctSin3 = 2276;
    var dctCos6 = 1567;
    var dctSin6 = 3784;
    var dctSqrt2 = 5793;
    var dctSqrt1d2 = 2896;
    function constructor() {}
    function buildHuffmanTable(codeLengths, values) {
      var k = 0, code = [], i, j, length = 16;
      while (length > 0 && !codeLengths[length - 1])
        length--;
      code.push({ children: [], index: 0 });
      var p = code[0], q;
      for (i = 0;i < length; i++) {
        for (j = 0;j < codeLengths[i]; j++) {
          p = code.pop();
          p.children[p.index] = values[k];
          while (p.index > 0) {
            if (code.length === 0)
              throw new Error("Could not recreate Huffman Table");
            p = code.pop();
          }
          p.index++;
          code.push(p);
          while (code.length <= i) {
            code.push(q = { children: [], index: 0 });
            p.children[p.index] = q.children;
            p = q;
          }
          k++;
        }
        if (i + 1 < length) {
          code.push(q = { children: [], index: 0 });
          p.children[p.index] = q.children;
          p = q;
        }
      }
      return code[0].children;
    }
    function decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive, opts) {
      var precision = frame.precision;
      var samplesPerLine = frame.samplesPerLine;
      var scanLines = frame.scanLines;
      var mcusPerLine = frame.mcusPerLine;
      var progressive = frame.progressive;
      var { maxH, maxV } = frame;
      var startOffset = offset, bitsData = 0, bitsCount = 0;
      function readBit() {
        if (bitsCount > 0) {
          bitsCount--;
          return bitsData >> bitsCount & 1;
        }
        bitsData = data[offset++];
        if (bitsData == 255) {
          var nextByte = data[offset++];
          if (nextByte) {
            throw new Error("unexpected marker: " + (bitsData << 8 | nextByte).toString(16));
          }
        }
        bitsCount = 7;
        return bitsData >>> 7;
      }
      function decodeHuffman(tree) {
        var node = tree, bit;
        while ((bit = readBit()) !== null) {
          node = node[bit];
          if (typeof node === "number")
            return node;
          if (typeof node !== "object")
            throw new Error("invalid huffman sequence");
        }
        return null;
      }
      function receive(length) {
        var n2 = 0;
        while (length > 0) {
          var bit = readBit();
          if (bit === null)
            return;
          n2 = n2 << 1 | bit;
          length--;
        }
        return n2;
      }
      function receiveAndExtend(length) {
        var n2 = receive(length);
        if (n2 >= 1 << length - 1)
          return n2;
        return n2 + (-1 << length) + 1;
      }
      function decodeBaseline(component2, zz) {
        var t = decodeHuffman(component2.huffmanTableDC);
        var diff = t === 0 ? 0 : receiveAndExtend(t);
        zz[0] = component2.pred += diff;
        var k2 = 1;
        while (k2 < 64) {
          var rs = decodeHuffman(component2.huffmanTableAC);
          var s = rs & 15, r = rs >> 4;
          if (s === 0) {
            if (r < 15)
              break;
            k2 += 16;
            continue;
          }
          k2 += r;
          var z = dctZigZag[k2];
          zz[z] = receiveAndExtend(s);
          k2++;
        }
      }
      function decodeDCFirst(component2, zz) {
        var t = decodeHuffman(component2.huffmanTableDC);
        var diff = t === 0 ? 0 : receiveAndExtend(t) << successive;
        zz[0] = component2.pred += diff;
      }
      function decodeDCSuccessive(component2, zz) {
        zz[0] |= readBit() << successive;
      }
      var eobrun = 0;
      function decodeACFirst(component2, zz) {
        if (eobrun > 0) {
          eobrun--;
          return;
        }
        var k2 = spectralStart, e = spectralEnd;
        while (k2 <= e) {
          var rs = decodeHuffman(component2.huffmanTableAC);
          var s = rs & 15, r = rs >> 4;
          if (s === 0) {
            if (r < 15) {
              eobrun = receive(r) + (1 << r) - 1;
              break;
            }
            k2 += 16;
            continue;
          }
          k2 += r;
          var z = dctZigZag[k2];
          zz[z] = receiveAndExtend(s) * (1 << successive);
          k2++;
        }
      }
      var successiveACState = 0, successiveACNextValue;
      function decodeACSuccessive(component2, zz) {
        var k2 = spectralStart, e = spectralEnd, r = 0;
        while (k2 <= e) {
          var z = dctZigZag[k2];
          var direction = zz[z] < 0 ? -1 : 1;
          switch (successiveACState) {
            case 0:
              var rs = decodeHuffman(component2.huffmanTableAC);
              var s = rs & 15, r = rs >> 4;
              if (s === 0) {
                if (r < 15) {
                  eobrun = receive(r) + (1 << r);
                  successiveACState = 4;
                } else {
                  r = 16;
                  successiveACState = 1;
                }
              } else {
                if (s !== 1)
                  throw new Error("invalid ACn encoding");
                successiveACNextValue = receiveAndExtend(s);
                successiveACState = r ? 2 : 3;
              }
              continue;
            case 1:
            case 2:
              if (zz[z])
                zz[z] += (readBit() << successive) * direction;
              else {
                r--;
                if (r === 0)
                  successiveACState = successiveACState == 2 ? 3 : 0;
              }
              break;
            case 3:
              if (zz[z])
                zz[z] += (readBit() << successive) * direction;
              else {
                zz[z] = successiveACNextValue << successive;
                successiveACState = 0;
              }
              break;
            case 4:
              if (zz[z])
                zz[z] += (readBit() << successive) * direction;
              break;
          }
          k2++;
        }
        if (successiveACState === 4) {
          eobrun--;
          if (eobrun === 0)
            successiveACState = 0;
        }
      }
      function decodeMcu(component2, decode2, mcu2, row, col) {
        var mcuRow = mcu2 / mcusPerLine | 0;
        var mcuCol = mcu2 % mcusPerLine;
        var blockRow = mcuRow * component2.v + row;
        var blockCol = mcuCol * component2.h + col;
        if (component2.blocks[blockRow] === undefined && opts.tolerantDecoding)
          return;
        decode2(component2, component2.blocks[blockRow][blockCol]);
      }
      function decodeBlock(component2, decode2, mcu2) {
        var blockRow = mcu2 / component2.blocksPerLine | 0;
        var blockCol = mcu2 % component2.blocksPerLine;
        if (component2.blocks[blockRow] === undefined && opts.tolerantDecoding)
          return;
        decode2(component2, component2.blocks[blockRow][blockCol]);
      }
      var componentsLength = components.length;
      var component, i, j, k, n;
      var decodeFn;
      if (progressive) {
        if (spectralStart === 0)
          decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
        else
          decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
      } else {
        decodeFn = decodeBaseline;
      }
      var mcu = 0, marker;
      var mcuExpected;
      if (componentsLength == 1) {
        mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
      } else {
        mcuExpected = mcusPerLine * frame.mcusPerColumn;
      }
      if (!resetInterval)
        resetInterval = mcuExpected;
      var h, v;
      while (mcu < mcuExpected) {
        for (i = 0;i < componentsLength; i++)
          components[i].pred = 0;
        eobrun = 0;
        if (componentsLength == 1) {
          component = components[0];
          for (n = 0;n < resetInterval; n++) {
            decodeBlock(component, decodeFn, mcu);
            mcu++;
          }
        } else {
          for (n = 0;n < resetInterval; n++) {
            for (i = 0;i < componentsLength; i++) {
              component = components[i];
              h = component.h;
              v = component.v;
              for (j = 0;j < v; j++) {
                for (k = 0;k < h; k++) {
                  decodeMcu(component, decodeFn, mcu, j, k);
                }
              }
            }
            mcu++;
            if (mcu === mcuExpected)
              break;
          }
        }
        if (mcu === mcuExpected) {
          do {
            if (data[offset] === 255) {
              if (data[offset + 1] !== 0) {
                break;
              }
            }
            offset += 1;
          } while (offset < data.length - 2);
        }
        bitsCount = 0;
        marker = data[offset] << 8 | data[offset + 1];
        if (marker < 65280) {
          throw new Error("marker was not found");
        }
        if (marker >= 65488 && marker <= 65495) {
          offset += 2;
        } else
          break;
      }
      return offset - startOffset;
    }
    function buildComponentData(frame, component) {
      var lines = [];
      var blocksPerLine = component.blocksPerLine;
      var blocksPerColumn = component.blocksPerColumn;
      var samplesPerLine = blocksPerLine << 3;
      var R = new Int32Array(64), r = new Uint8Array(64);
      function quantizeAndInverse(zz, dataOut, dataIn) {
        var qt = component.quantizationTable;
        var v0, v1, v2, v3, v4, v5, v6, v7, t;
        var p = dataIn;
        var i2;
        for (i2 = 0;i2 < 64; i2++)
          p[i2] = zz[i2] * qt[i2];
        for (i2 = 0;i2 < 8; ++i2) {
          var row = 8 * i2;
          if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 && p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 && p[7 + row] == 0) {
            t = dctSqrt2 * p[0 + row] + 512 >> 10;
            p[0 + row] = t;
            p[1 + row] = t;
            p[2 + row] = t;
            p[3 + row] = t;
            p[4 + row] = t;
            p[5 + row] = t;
            p[6 + row] = t;
            p[7 + row] = t;
            continue;
          }
          v0 = dctSqrt2 * p[0 + row] + 128 >> 8;
          v1 = dctSqrt2 * p[4 + row] + 128 >> 8;
          v2 = p[2 + row];
          v3 = p[6 + row];
          v4 = dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128 >> 8;
          v7 = dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128 >> 8;
          v5 = p[3 + row] << 4;
          v6 = p[5 + row] << 4;
          t = v0 - v1 + 1 >> 1;
          v0 = v0 + v1 + 1 >> 1;
          v1 = t;
          t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
          v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
          v3 = t;
          t = v4 - v6 + 1 >> 1;
          v4 = v4 + v6 + 1 >> 1;
          v6 = t;
          t = v7 + v5 + 1 >> 1;
          v5 = v7 - v5 + 1 >> 1;
          v7 = t;
          t = v0 - v3 + 1 >> 1;
          v0 = v0 + v3 + 1 >> 1;
          v3 = t;
          t = v1 - v2 + 1 >> 1;
          v1 = v1 + v2 + 1 >> 1;
          v2 = t;
          t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
          v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
          v7 = t;
          t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
          v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
          v6 = t;
          p[0 + row] = v0 + v7;
          p[7 + row] = v0 - v7;
          p[1 + row] = v1 + v6;
          p[6 + row] = v1 - v6;
          p[2 + row] = v2 + v5;
          p[5 + row] = v2 - v5;
          p[3 + row] = v3 + v4;
          p[4 + row] = v3 - v4;
        }
        for (i2 = 0;i2 < 8; ++i2) {
          var col = i2;
          if (p[1 * 8 + col] == 0 && p[2 * 8 + col] == 0 && p[3 * 8 + col] == 0 && p[4 * 8 + col] == 0 && p[5 * 8 + col] == 0 && p[6 * 8 + col] == 0 && p[7 * 8 + col] == 0) {
            t = dctSqrt2 * dataIn[i2 + 0] + 8192 >> 14;
            p[0 * 8 + col] = t;
            p[1 * 8 + col] = t;
            p[2 * 8 + col] = t;
            p[3 * 8 + col] = t;
            p[4 * 8 + col] = t;
            p[5 * 8 + col] = t;
            p[6 * 8 + col] = t;
            p[7 * 8 + col] = t;
            continue;
          }
          v0 = dctSqrt2 * p[0 * 8 + col] + 2048 >> 12;
          v1 = dctSqrt2 * p[4 * 8 + col] + 2048 >> 12;
          v2 = p[2 * 8 + col];
          v3 = p[6 * 8 + col];
          v4 = dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048 >> 12;
          v7 = dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048 >> 12;
          v5 = p[3 * 8 + col];
          v6 = p[5 * 8 + col];
          t = v0 - v1 + 1 >> 1;
          v0 = v0 + v1 + 1 >> 1;
          v1 = t;
          t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
          v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
          v3 = t;
          t = v4 - v6 + 1 >> 1;
          v4 = v4 + v6 + 1 >> 1;
          v6 = t;
          t = v7 + v5 + 1 >> 1;
          v5 = v7 - v5 + 1 >> 1;
          v7 = t;
          t = v0 - v3 + 1 >> 1;
          v0 = v0 + v3 + 1 >> 1;
          v3 = t;
          t = v1 - v2 + 1 >> 1;
          v1 = v1 + v2 + 1 >> 1;
          v2 = t;
          t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
          v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
          v7 = t;
          t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
          v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
          v6 = t;
          p[0 * 8 + col] = v0 + v7;
          p[7 * 8 + col] = v0 - v7;
          p[1 * 8 + col] = v1 + v6;
          p[6 * 8 + col] = v1 - v6;
          p[2 * 8 + col] = v2 + v5;
          p[5 * 8 + col] = v2 - v5;
          p[3 * 8 + col] = v3 + v4;
          p[4 * 8 + col] = v3 - v4;
        }
        for (i2 = 0;i2 < 64; ++i2) {
          var sample2 = 128 + (p[i2] + 8 >> 4);
          dataOut[i2] = sample2 < 0 ? 0 : sample2 > 255 ? 255 : sample2;
        }
      }
      requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);
      var i, j;
      for (var blockRow = 0;blockRow < blocksPerColumn; blockRow++) {
        var scanLine = blockRow << 3;
        for (i = 0;i < 8; i++)
          lines.push(new Uint8Array(samplesPerLine));
        for (var blockCol = 0;blockCol < blocksPerLine; blockCol++) {
          quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);
          var offset = 0, sample = blockCol << 3;
          for (j = 0;j < 8; j++) {
            var line = lines[scanLine + j];
            for (i = 0;i < 8; i++)
              line[sample + i] = r[offset++];
          }
        }
      }
      return lines;
    }
    function clampTo8bit(a) {
      return a < 0 ? 0 : a > 255 ? 255 : a;
    }
    constructor.prototype = {
      load: function load(path) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", path, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function() {
          var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
          this.parse(data);
          if (this.onload)
            this.onload();
        }.bind(this);
        xhr.send(null);
      },
      parse: function parse(data) {
        var maxResolutionInPixels = this.opts.maxResolutionInMP * 1000 * 1000;
        var offset = 0, length = data.length;
        function readUint16() {
          var value = data[offset] << 8 | data[offset + 1];
          offset += 2;
          return value;
        }
        function readDataBlock() {
          var length2 = readUint16();
          var array = data.subarray(offset, offset + length2 - 2);
          offset += array.length;
          return array;
        }
        function prepareComponents(frame2) {
          var maxH2 = 1, maxV2 = 1;
          var component2, componentId2;
          for (componentId2 in frame2.components) {
            if (frame2.components.hasOwnProperty(componentId2)) {
              component2 = frame2.components[componentId2];
              if (maxH2 < component2.h)
                maxH2 = component2.h;
              if (maxV2 < component2.v)
                maxV2 = component2.v;
            }
          }
          var mcusPerLine = Math.ceil(frame2.samplesPerLine / 8 / maxH2);
          var mcusPerColumn = Math.ceil(frame2.scanLines / 8 / maxV2);
          for (componentId2 in frame2.components) {
            if (frame2.components.hasOwnProperty(componentId2)) {
              component2 = frame2.components[componentId2];
              var blocksPerLine = Math.ceil(Math.ceil(frame2.samplesPerLine / 8) * component2.h / maxH2);
              var blocksPerColumn = Math.ceil(Math.ceil(frame2.scanLines / 8) * component2.v / maxV2);
              var blocksPerLineForMcu = mcusPerLine * component2.h;
              var blocksPerColumnForMcu = mcusPerColumn * component2.v;
              var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
              var blocks = [];
              requestMemoryAllocation(blocksToAllocate * 256);
              for (var i2 = 0;i2 < blocksPerColumnForMcu; i2++) {
                var row = [];
                for (var j2 = 0;j2 < blocksPerLineForMcu; j2++)
                  row.push(new Int32Array(64));
                blocks.push(row);
              }
              component2.blocksPerLine = blocksPerLine;
              component2.blocksPerColumn = blocksPerColumn;
              component2.blocks = blocks;
            }
          }
          frame2.maxH = maxH2;
          frame2.maxV = maxV2;
          frame2.mcusPerLine = mcusPerLine;
          frame2.mcusPerColumn = mcusPerColumn;
        }
        var jfif = null;
        var adobe = null;
        var pixels = null;
        var frame, resetInterval;
        var quantizationTables = [], frames = [];
        var huffmanTablesAC = [], huffmanTablesDC = [];
        var fileMarker = readUint16();
        var malformedDataOffset = -1;
        this.comments = [];
        if (fileMarker != 65496) {
          throw new Error("SOI not found");
        }
        fileMarker = readUint16();
        while (fileMarker != 65497) {
          var i, j, l;
          switch (fileMarker) {
            case 65280:
              break;
            case 65504:
            case 65505:
            case 65506:
            case 65507:
            case 65508:
            case 65509:
            case 65510:
            case 65511:
            case 65512:
            case 65513:
            case 65514:
            case 65515:
            case 65516:
            case 65517:
            case 65518:
            case 65519:
            case 65534:
              var appData = readDataBlock();
              if (fileMarker === 65534) {
                var comment = String.fromCharCode.apply(null, appData);
                this.comments.push(comment);
              }
              if (fileMarker === 65504) {
                if (appData[0] === 74 && appData[1] === 70 && appData[2] === 73 && appData[3] === 70 && appData[4] === 0) {
                  jfif = {
                    version: { major: appData[5], minor: appData[6] },
                    densityUnits: appData[7],
                    xDensity: appData[8] << 8 | appData[9],
                    yDensity: appData[10] << 8 | appData[11],
                    thumbWidth: appData[12],
                    thumbHeight: appData[13],
                    thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                  };
                }
              }
              if (fileMarker === 65505) {
                if (appData[0] === 69 && appData[1] === 120 && appData[2] === 105 && appData[3] === 102 && appData[4] === 0) {
                  this.exifBuffer = appData.subarray(5, appData.length);
                }
              }
              if (fileMarker === 65518) {
                if (appData[0] === 65 && appData[1] === 100 && appData[2] === 111 && appData[3] === 98 && appData[4] === 101 && appData[5] === 0) {
                  adobe = {
                    version: appData[6],
                    flags0: appData[7] << 8 | appData[8],
                    flags1: appData[9] << 8 | appData[10],
                    transformCode: appData[11]
                  };
                }
              }
              break;
            case 65499:
              var quantizationTablesLength = readUint16();
              var quantizationTablesEnd = quantizationTablesLength + offset - 2;
              while (offset < quantizationTablesEnd) {
                var quantizationTableSpec = data[offset++];
                requestMemoryAllocation(64 * 4);
                var tableData = new Int32Array(64);
                if (quantizationTableSpec >> 4 === 0) {
                  for (j = 0;j < 64; j++) {
                    var z = dctZigZag[j];
                    tableData[z] = data[offset++];
                  }
                } else if (quantizationTableSpec >> 4 === 1) {
                  for (j = 0;j < 64; j++) {
                    var z = dctZigZag[j];
                    tableData[z] = readUint16();
                  }
                } else
                  throw new Error("DQT: invalid table spec");
                quantizationTables[quantizationTableSpec & 15] = tableData;
              }
              break;
            case 65472:
            case 65473:
            case 65474:
              readUint16();
              frame = {};
              frame.extended = fileMarker === 65473;
              frame.progressive = fileMarker === 65474;
              frame.precision = data[offset++];
              frame.scanLines = readUint16();
              frame.samplesPerLine = readUint16();
              frame.components = {};
              frame.componentsOrder = [];
              var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
              if (pixelsInFrame > maxResolutionInPixels) {
                var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
                throw new Error(`maxResolutionInMP limit exceeded by ${exceededAmount}MP`);
              }
              var componentsCount = data[offset++], componentId;
              var maxH = 0, maxV = 0;
              for (i = 0;i < componentsCount; i++) {
                componentId = data[offset];
                var h = data[offset + 1] >> 4;
                var v = data[offset + 1] & 15;
                var qId = data[offset + 2];
                if (h <= 0 || v <= 0) {
                  throw new Error("Invalid sampling factor, expected values above 0");
                }
                frame.componentsOrder.push(componentId);
                frame.components[componentId] = {
                  h,
                  v,
                  quantizationIdx: qId
                };
                offset += 3;
              }
              prepareComponents(frame);
              frames.push(frame);
              break;
            case 65476:
              var huffmanLength = readUint16();
              for (i = 2;i < huffmanLength; ) {
                var huffmanTableSpec = data[offset++];
                var codeLengths = new Uint8Array(16);
                var codeLengthSum = 0;
                for (j = 0;j < 16; j++, offset++) {
                  codeLengthSum += codeLengths[j] = data[offset];
                }
                requestMemoryAllocation(16 + codeLengthSum);
                var huffmanValues = new Uint8Array(codeLengthSum);
                for (j = 0;j < codeLengthSum; j++, offset++)
                  huffmanValues[j] = data[offset];
                i += 17 + codeLengthSum;
                (huffmanTableSpec >> 4 === 0 ? huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
              }
              break;
            case 65501:
              readUint16();
              resetInterval = readUint16();
              break;
            case 65500:
              readUint16();
              readUint16();
              break;
            case 65498:
              var scanLength = readUint16();
              var selectorsCount = data[offset++];
              var components = [], component;
              for (i = 0;i < selectorsCount; i++) {
                component = frame.components[data[offset++]];
                var tableSpec = data[offset++];
                component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                components.push(component);
              }
              var spectralStart = data[offset++];
              var spectralEnd = data[offset++];
              var successiveApproximation = data[offset++];
              var processed = decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successiveApproximation >> 4, successiveApproximation & 15, this.opts);
              offset += processed;
              break;
            case 65535:
              if (data[offset] !== 255) {
                offset--;
              }
              break;
            default:
              if (data[offset - 3] == 255 && data[offset - 2] >= 192 && data[offset - 2] <= 254) {
                offset -= 3;
                break;
              } else if (fileMarker === 224 || fileMarker == 225) {
                if (malformedDataOffset !== -1) {
                  throw new Error(`first unknown JPEG marker at offset ${malformedDataOffset.toString(16)}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(offset - 1).toString(16)}`);
                }
                malformedDataOffset = offset - 1;
                const nextOffset = readUint16();
                if (data[offset + nextOffset - 2] === 255) {
                  offset += nextOffset - 2;
                  break;
                }
              }
              throw new Error("unknown JPEG marker " + fileMarker.toString(16));
          }
          fileMarker = readUint16();
        }
        if (frames.length != 1)
          throw new Error("only single frame JPEGs supported");
        for (var i = 0;i < frames.length; i++) {
          var cp = frames[i].components;
          for (var j in cp) {
            cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
            delete cp[j].quantizationIdx;
          }
        }
        this.width = frame.samplesPerLine;
        this.height = frame.scanLines;
        this.jfif = jfif;
        this.adobe = adobe;
        this.components = [];
        for (var i = 0;i < frame.componentsOrder.length; i++) {
          var component = frame.components[frame.componentsOrder[i]];
          this.components.push({
            lines: buildComponentData(frame, component),
            scaleX: component.h / frame.maxH,
            scaleY: component.v / frame.maxV
          });
        }
      },
      getData: function getData(width, height) {
        var scaleX = this.width / width, scaleY = this.height / height;
        var component1, component2, component3, component4;
        var component1Line, component2Line, component3Line, component4Line;
        var x, y;
        var offset = 0;
        var Y, Cb, Cr, K, C, M, Ye, R, G, B;
        var colorTransform;
        var dataLength = width * height * this.components.length;
        requestMemoryAllocation(dataLength);
        var data = new Uint8Array(dataLength);
        switch (this.components.length) {
          case 1:
            component1 = this.components[0];
            for (y = 0;y < height; y++) {
              component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
              for (x = 0;x < width; x++) {
                Y = component1Line[0 | x * component1.scaleX * scaleX];
                data[offset++] = Y;
              }
            }
            break;
          case 2:
            component1 = this.components[0];
            component2 = this.components[1];
            for (y = 0;y < height; y++) {
              component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
              component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
              for (x = 0;x < width; x++) {
                Y = component1Line[0 | x * component1.scaleX * scaleX];
                data[offset++] = Y;
                Y = component2Line[0 | x * component2.scaleX * scaleX];
                data[offset++] = Y;
              }
            }
            break;
          case 3:
            colorTransform = true;
            if (this.adobe && this.adobe.transformCode)
              colorTransform = true;
            else if (typeof this.opts.colorTransform !== "undefined")
              colorTransform = !!this.opts.colorTransform;
            component1 = this.components[0];
            component2 = this.components[1];
            component3 = this.components[2];
            for (y = 0;y < height; y++) {
              component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
              component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
              component3Line = component3.lines[0 | y * component3.scaleY * scaleY];
              for (x = 0;x < width; x++) {
                if (!colorTransform) {
                  R = component1Line[0 | x * component1.scaleX * scaleX];
                  G = component2Line[0 | x * component2.scaleX * scaleX];
                  B = component3Line[0 | x * component3.scaleX * scaleX];
                } else {
                  Y = component1Line[0 | x * component1.scaleX * scaleX];
                  Cb = component2Line[0 | x * component2.scaleX * scaleX];
                  Cr = component3Line[0 | x * component3.scaleX * scaleX];
                  R = clampTo8bit(Y + 1.402 * (Cr - 128));
                  G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                  B = clampTo8bit(Y + 1.772 * (Cb - 128));
                }
                data[offset++] = R;
                data[offset++] = G;
                data[offset++] = B;
              }
            }
            break;
          case 4:
            if (!this.adobe)
              throw new Error("Unsupported color mode (4 components)");
            colorTransform = false;
            if (this.adobe && this.adobe.transformCode)
              colorTransform = true;
            else if (typeof this.opts.colorTransform !== "undefined")
              colorTransform = !!this.opts.colorTransform;
            component1 = this.components[0];
            component2 = this.components[1];
            component3 = this.components[2];
            component4 = this.components[3];
            for (y = 0;y < height; y++) {
              component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
              component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
              component3Line = component3.lines[0 | y * component3.scaleY * scaleY];
              component4Line = component4.lines[0 | y * component4.scaleY * scaleY];
              for (x = 0;x < width; x++) {
                if (!colorTransform) {
                  C = component1Line[0 | x * component1.scaleX * scaleX];
                  M = component2Line[0 | x * component2.scaleX * scaleX];
                  Ye = component3Line[0 | x * component3.scaleX * scaleX];
                  K = component4Line[0 | x * component4.scaleX * scaleX];
                } else {
                  Y = component1Line[0 | x * component1.scaleX * scaleX];
                  Cb = component2Line[0 | x * component2.scaleX * scaleX];
                  Cr = component3Line[0 | x * component3.scaleX * scaleX];
                  K = component4Line[0 | x * component4.scaleX * scaleX];
                  C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                  M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                  Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
                }
                data[offset++] = 255 - C;
                data[offset++] = 255 - M;
                data[offset++] = 255 - Ye;
                data[offset++] = 255 - K;
              }
            }
            break;
          default:
            throw new Error("Unsupported color mode");
        }
        return data;
      },
      copyToImageData: function copyToImageData(imageData, formatAsRGBA) {
        var { width, height } = imageData;
        var imageDataArray = imageData.data;
        var data = this.getData(width, height);
        var i = 0, j = 0, x, y;
        var Y, K, C, M, R, G, B;
        switch (this.components.length) {
          case 1:
            for (y = 0;y < height; y++) {
              for (x = 0;x < width; x++) {
                Y = data[i++];
                imageDataArray[j++] = Y;
                imageDataArray[j++] = Y;
                imageDataArray[j++] = Y;
                if (formatAsRGBA) {
                  imageDataArray[j++] = 255;
                }
              }
            }
            break;
          case 3:
            for (y = 0;y < height; y++) {
              for (x = 0;x < width; x++) {
                R = data[i++];
                G = data[i++];
                B = data[i++];
                imageDataArray[j++] = R;
                imageDataArray[j++] = G;
                imageDataArray[j++] = B;
                if (formatAsRGBA) {
                  imageDataArray[j++] = 255;
                }
              }
            }
            break;
          case 4:
            for (y = 0;y < height; y++) {
              for (x = 0;x < width; x++) {
                C = data[i++];
                M = data[i++];
                Y = data[i++];
                K = data[i++];
                R = 255 - clampTo8bit(C * (1 - K / 255) + K);
                G = 255 - clampTo8bit(M * (1 - K / 255) + K);
                B = 255 - clampTo8bit(Y * (1 - K / 255) + K);
                imageDataArray[j++] = R;
                imageDataArray[j++] = G;
                imageDataArray[j++] = B;
                if (formatAsRGBA) {
                  imageDataArray[j++] = 255;
                }
              }
            }
            break;
          default:
            throw new Error("Unsupported color mode");
        }
      }
    };
    var totalBytesAllocated = 0;
    var maxMemoryUsageBytes = 0;
    function requestMemoryAllocation(increaseAmount = 0) {
      var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
      if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
        var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
        throw new Error(`maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB`);
      }
      totalBytesAllocated = totalMemoryImpactBytes;
    }
    constructor.resetMaxMemoryUsage = function(maxMemoryUsageBytes_) {
      totalBytesAllocated = 0;
      maxMemoryUsageBytes = maxMemoryUsageBytes_;
    };
    constructor.getBytesAllocated = function() {
      return totalBytesAllocated;
    };
    constructor.requestMemoryAllocation = requestMemoryAllocation;
    return constructor;
  }();
  if (typeof module !== "undefined") {
    module.exports = decode;
  } else if (typeof window !== "undefined") {
    window["jpeg-js"] = window["jpeg-js"] || {};
    window["jpeg-js"].decode = decode;
  }
  function decode(jpegData, userOpts = {}) {
    var defaultOpts = {
      colorTransform: undefined,
      useTArray: false,
      formatAsRGBA: true,
      tolerantDecoding: true,
      maxResolutionInMP: 100,
      maxMemoryUsageInMB: 512
    };
    var opts = { ...defaultOpts, ...userOpts };
    var arr = new Uint8Array(jpegData);
    var decoder = new JpegImage;
    decoder.opts = opts;
    JpegImage.resetMaxMemoryUsage(opts.maxMemoryUsageInMB * 1024 * 1024);
    decoder.parse(arr);
    var channels = opts.formatAsRGBA ? 4 : 3;
    var bytesNeeded = decoder.width * decoder.height * channels;
    try {
      JpegImage.requestMemoryAllocation(bytesNeeded);
      var image = {
        width: decoder.width,
        height: decoder.height,
        exifBuffer: decoder.exifBuffer,
        data: opts.useTArray ? new Uint8Array(bytesNeeded) : Buffer.alloc(bytesNeeded)
      };
      if (decoder.comments.length > 0) {
        image["comments"] = decoder.comments;
      }
    } catch (err) {
      if (err instanceof RangeError) {
        throw new Error("Could not allocate enough memory for the image. " + "Required: " + bytesNeeded);
      }
      if (err instanceof ReferenceError) {
        if (err.message === "Buffer is not defined") {
          throw new Error("Buffer is not globally defined in this environment. " + "Consider setting useTArray to true");
        }
      }
      throw err;
    }
    decoder.copyToImageData(image, opts.formatAsRGBA);
    return image;
  }
});

// node_modules/jpeg-js/index.js
var require_jpeg_js = __commonJS((exports, module) => {
  var encode = require_encoder();
  var decode = require_decoder();
  module.exports = {
    encode,
    decode
  };
});

// src/plugin.ts
import { createHash as createHash2 } from "crypto";

// src/sdk.ts
class PluginError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "PluginError";
  }
}
function answer(id, payload) {
  process.stdout.write(`${JSON.stringify({ id, ...payload })}
`);
}
async function serve(handler) {
  let request = null;
  try {
    const input = await new Response(Bun.stdin.stream()).text();
    const line = input.split(`
`).map((value) => value.trim()).filter(Boolean).pop();
    request = line ? JSON.parse(line) : null;
  } catch {
    request = null;
  }
  if (!request || typeof request.command !== "string") {
    process.stdout.write(`${JSON.stringify({ id: "0", error: { code: "internal", message: "The request could not be read." } })}
`);
    return;
  }
  try {
    const data = await handler(request);
    answer(request.id, { data });
  } catch (error) {
    const failure = error instanceof PluginError ? { code: error.code, message: error.message } : {
      code: "internal",
      message: error instanceof Error ? error.message : "The plugin failed."
    };
    answer(request.id, { error: failure });
  }
}

// src/api.ts
var TIMEOUT_MS = 12000;
var MAX_BYTES = 2000000;
var MAX_TITLES = 50;
var CALL_WIDTH = 2;
var MAX_BACKLINKS = 20;
var MAX_BACKLINK_TITLE = 200;
var THUMB_WIDTH = 480;
var USER_AGENT = "salvage-plugin-wikipedia/0.1.0 (https://github.com/aliyss/salvage-web)";
var MAX_HOPS = 3;
var WIKI_PAGE = /^https?:\/\/(?:www\.)?([a-z-]{2,16})(?:\.m)?\.wikipedia\.org\/wiki\/([^?#]+)/i;
var INDEX_PAGE = /^https?:\/\/(?:www\.)?([a-z-]{2,16})(?:\.m)?\.wikipedia\.org\/w\/index\.php\?(?:[^#]*&)?title=([^&#]+)/i;
function articleOf(url) {
  if (!url) {
    return null;
  }
  const match = WIKI_PAGE.exec(url.trim()) ?? INDEX_PAGE.exec(url.trim());
  if (!match) {
    return null;
  }
  const language = (match[1] ?? "").toLowerCase();
  const raw = match[2] ?? "";
  let title;
  try {
    title = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const readable = title.replace(/_/g, " ").trim();
  if (!language || !readable || readable.length > MAX_BACKLINK_TITLE) {
    return null;
  }
  return { language, title: readable };
}
function pageUrl(language, title) {
  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function textOf(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function httpsUrl(value) {
  const text = textOf(value);
  return text && text.startsWith("https://") && text.length <= 2048 ? text : null;
}
async function readJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  }).catch(() => null);
  if (!response?.ok) {
    await response?.body?.cancel().catch(() => {
      return;
    });
    return null;
  }
  const raw = await new Response(response.body).text();
  if (raw.length > MAX_BYTES) {
    return null;
  }
  try {
    const body = JSON.parse(raw);
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}
function query(language, params) {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}
async function summariesOf(language, asked) {
  const byTitle = new Map;
  if (asked.length === 0) {
    return byTitle;
  }
  const body = await readJson(query(language, {
    prop: "pageimages|extracts|description",
    exintro: "1",
    explaintext: "1",
    exlimit: "max",
    piprop: "thumbnail",
    pithumbsize: String(THUMB_WIDTH),
    redirects: "1",
    titles: asked.join("|")
  }));
  const answer2 = isRecord(body) ? body.query : null;
  if (!isRecord(answer2) || !Array.isArray(answer2.pages)) {
    return byTitle;
  }
  const resolved = new Map;
  for (const key of ["normalized", "redirects"]) {
    const list = answer2[key];
    if (!Array.isArray(list)) {
      continue;
    }
    for (const row of list) {
      if (isRecord(row) && typeof row.from === "string" && typeof row.to === "string") {
        resolved.set(row.from, row.to);
      }
    }
  }
  const byName = new Map;
  for (const page of answer2.pages) {
    if (!isRecord(page) || page.missing === true) {
      continue;
    }
    const title = textOf(page.title);
    if (!title) {
      continue;
    }
    const thumbnail = isRecord(page.thumbnail) ? httpsUrl(page.thumbnail.source) : null;
    const article = {
      title,
      description: textOf(page.description),
      extract: textOf(page.extract),
      thumbnail
    };
    byName.set(title, article);
  }
  for (const title of asked) {
    let current = title;
    let found = byName.get(current);
    for (let hop = 0;!found && hop < MAX_HOPS; hop += 1) {
      const next = resolved.get(current);
      if (!next || next === current) {
        break;
      }
      current = next;
      found = byName.get(current);
    }
    if (found) {
      byTitle.set(title, found);
    }
  }
  return byTitle;
}
async function summaries(language, titles) {
  const asked = [...new Set(titles.filter((title) => title.trim()))];
  const byTitle = new Map;
  const batches = [];
  for (let at = 0;at < asked.length; at += MAX_TITLES) {
    batches.push(asked.slice(at, at + MAX_TITLES));
  }
  for (let at = 0;at < batches.length; at += CALL_WIDTH) {
    const answers = await Promise.all(batches.slice(at, at + CALL_WIDTH).map((batch) => summariesOf(language, batch)));
    for (const answer2 of answers) {
      for (const [title, article] of answer2) {
        byTitle.set(title, article);
      }
    }
  }
  return byTitle;
}
async function backlinks(language, title) {
  const body = await readJson(query(language, {
    list: "backlinks",
    bltitle: title,
    bllimit: String(MAX_BACKLINKS),
    blnamespace: "0",
    blredirect: "1"
  }));
  const answer2 = isRecord(body) ? body.query : null;
  const rows = isRecord(answer2) ? answer2.backlinks : null;
  if (!Array.isArray(rows)) {
    return [];
  }
  const titles = [];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.title !== "string") {
      continue;
    }
    const linked = row.title.trim();
    if (linked && linked !== title && !titles.includes(linked)) {
      titles.push(linked);
    }
    if (titles.length >= MAX_BACKLINKS) {
      break;
    }
  }
  return titles;
}
async function readArticle(url) {
  const found = articleOf(url);
  if (!found) {
    throw new PluginError("bad_subject", "This entry does not link to a Wikipedia article.");
  }
  const pages = await summaries(found.language, [found.title]);
  const article = pages.get(found.title);
  if (!article) {
    throw new PluginError("no_data", "Wikipedia has no article by that name.");
  }
  return {
    language: found.language,
    article,
    backlinks: await backlinks(found.language, article.title).catch(() => [])
  };
}

// src/index.ts
import { Database } from "bun:sqlite";
import { stat } from "fs/promises";
import { join } from "path";
var MAX_TITLES2 = 200;
var MAX_QUERY = 60;
function indexFile(archive) {
  return join(process.env.SALVAGE_PLUGIN_DATA ?? ".", "downloads", `${archive}.sqlite`);
}
function archiveOf(value) {
  const archive = typeof value === "string" ? value.trim() : "";
  return /^[a-z]{2,16}wiki$/.test(archive) ? archive : "enwiki";
}
async function indexReady(archive) {
  return Boolean(await stat(indexFile(archive)).catch(() => null));
}
async function readTitles(archive, options = {}) {
  const file = indexFile(archive);
  if (!await indexReady(archive)) {
    throw new PluginError("no_data", "Download this Wikipedia's titles on the plugin's own page first.");
  }
  const offset = Math.max(0, Math.round(options.offset ?? 0));
  const limit = Math.min(MAX_TITLES2, Math.max(1, Math.round(options.limit ?? 30)));
  const rows = Math.max(1, limit + 1);
  const query2 = (options.query ?? "").trim().slice(0, MAX_QUERY);
  const db = new Database(file, { readonly: true });
  try {
    const statement = query2 ? db.prepare(`SELECT title FROM titles WHERE title LIKE ? ESCAPE '\\'
           ORDER BY length(title), title LIMIT ? OFFSET ?`) : db.prepare("SELECT title FROM titles ORDER BY title LIMIT ? OFFSET ?");
    const found = query2 ? statement.all(`%${query2.replace(/[%_\\]/g, "\\$&")}%`, rows, offset) : statement.all(rows, offset);
    const titles = found.map((row) => row.title);
    return {
      titles: titles.slice(0, limit),
      hasMore: titles.length > limit
    };
  } finally {
    db.close();
  }
}

// src/stills.ts
var import_jpeg_js = __toESM(require_jpeg_js(), 1);
import { createHash } from "crypto";
import { mkdir, readFile, rename, stat as stat2, writeFile } from "fs/promises";
import { join as join2 } from "path";
import { inflateSync } from "zlib";
var TIMEOUT_MS2 = 1e4;
var MAX_BYTES2 = 1500000;
var HASH_CHARS = 32;
var CONCURRENCY = 8;
var EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
var RGBA_CHANNELS = 4;
var ALPHA_INDEX = 3;
var OPAQUE_ALPHA = 255;
var TRANSPARENT_ALPHA = 128;
var SAMPLE_SIZE = 64;
var BUCKET_SHIFT = 4;
var CHANNEL_MAX = 255;
var HEX = /^#[0-9A-F]{6}$/;
var PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
var PNG_HEAD_BYTES = 8;
var CHUNK_LENGTH_BYTES = 4;
var CHUNK_TYPE_BYTES = 4;
var CRC_BYTES = 4;
var IHDR_WIDTH = 0;
var IHDR_HEIGHT = 4;
var IHDR_DEPTH = 8;
var IHDR_KIND = 9;
var IHDR_INTERLACE = 12;
var BYTE = 255;
var BYTE_BITS = 8;
var BIT_OFFSET = 16;
var BIT_LAST = 24;
var DEPTH_8 = 8;
var PNG_CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
var PALETTE_STEP = 3;
var FILTER_SUB = 1;
var FILTER_UP = 2;
var FILTER_AVERAGE = 3;
var FILTER_PAETH = 4;
var AVERAGE_SHIFT = 1;
function mediaDirectory() {
  return join2(process.env.SALVAGE_PLUGIN_DATA ?? ".", "media");
}
function extensionOf(pathname) {
  const last = pathname.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSIONS.includes(last) ? last : null;
}
function stillName(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") {
    return null;
  }
  const extension = extensionOf(parsed.pathname);
  if (!extension) {
    return null;
  }
  const hash = createHash("sha256").update(url).digest("hex");
  return `${hash.slice(0, HASH_CHARS)}.${extension}`;
}
async function filed(name) {
  return Boolean(await stat2(join2(mediaDirectory(), name)).catch(() => null));
}
async function keepOne(url) {
  const name = url ? stillName(url) : null;
  if (!url || !name) {
    return null;
  }
  if (await filed(name)) {
    return name;
  }
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS2),
      headers: { "user-agent": "salvage-plugin-wikipedia/0.1.0" }
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => {
        return;
      });
      return null;
    }
    if (!(response.headers.get("content-type") ?? "").startsWith("image/")) {
      await response.body?.cancel().catch(() => {
        return;
      });
      return null;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES2) {
      return null;
    }
    await mkdir(mediaDirectory(), { recursive: true });
    const part = join2(mediaDirectory(), `${name}.part`);
    await writeFile(part, bytes).catch(() => {
      return;
    });
    await rename(part, join2(mediaDirectory(), name)).catch(() => {
      return;
    });
    return name;
  } catch {
    return null;
  }
}
async function keepStills(urls) {
  const names = urls.map(() => null);
  let next = 0;
  const worker = async () => {
    for (;; ) {
      const index = next;
      next += 1;
      if (index >= urls.length) {
        return;
      }
      names[index] = await keepOne(urls[index] ?? null);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  return names;
}
function isColor(value) {
  return typeof value === "string" && HEX.test(value);
}
function channelOf(value) {
  return Math.min(CHANNEL_MAX, Math.max(0, Math.round(value))).toString(16).padStart(2, "0").toUpperCase();
}
function readU32(bytes, at) {
  return ((bytes[at] ?? 0) << BIT_LAST) + ((bytes[at + 1] ?? 0) << BIT_OFFSET) + ((bytes[at + 2] ?? 0) << BYTE_BITS) + (bytes[at + 3] ?? 0);
}
function paeth(left, up, upLeft) {
  const guess = left + up - upLeft;
  const toLeft = Math.abs(guess - left);
  const toUp = Math.abs(guess - up);
  const toCorner = Math.abs(guess - upLeft);
  if (toLeft <= toUp && toLeft <= toCorner) {
    return left;
  }
  return toUp <= toCorner ? up : upLeft;
}
function unfiltered(raw, width, height, channels) {
  const stride = width * channels;
  if (raw.length < height * (1 + stride)) {
    return null;
  }
  const out = new Uint8Array(stride * height);
  for (let y = 0;y < height; y += 1) {
    const at = y * (1 + stride);
    const filter = raw[at] ?? 0;
    const line = y * stride;
    const previous = line - stride;
    for (let x = 0;x < stride; x += 1) {
      const value = raw[at + 1 + x] ?? 0;
      const left = x >= channels ? out[line + x - channels] ?? 0 : 0;
      const up = y > 0 ? out[previous + x] ?? 0 : 0;
      const upLeft = y > 0 && x >= channels ? out[previous + x - channels] ?? 0 : 0;
      let restored = value;
      if (filter === FILTER_SUB) {
        restored = value + left;
      } else if (filter === FILTER_UP) {
        restored = value + up;
      } else if (filter === FILTER_AVERAGE) {
        restored = value + (left + up >> AVERAGE_SHIFT);
      } else if (filter === FILTER_PAETH) {
        restored = value + paeth(left, up, upLeft);
      }
      out[line + x] = restored & BYTE;
    }
  }
  return out;
}
function paletteOf(palette, index) {
  const at = index * PALETTE_STEP;
  if (at + PALETTE_STEP > palette.length) {
    return null;
  }
  return [palette[at] ?? 0, palette[at + 1] ?? 0, palette[at + 2] ?? 0];
}
function rgbaOfPng(pixels, width, height, kind, palette, alpha) {
  const channels = PNG_CHANNELS[kind];
  if (!channels) {
    return null;
  }
  const out = new Uint8Array(width * height * RGBA_CHANNELS);
  for (let i = 0;i < width * height; i += 1) {
    const at = i * channels;
    const to = i * RGBA_CHANNELS;
    let red = 0;
    let green = 0;
    let blue = 0;
    let opacity = OPAQUE_ALPHA;
    if (kind === 0 || kind === 4) {
      red = pixels[at] ?? 0;
      green = red;
      blue = red;
      opacity = kind === 4 ? pixels[at + 1] ?? OPAQUE_ALPHA : OPAQUE_ALPHA;
    } else if (kind === 2 || kind === 6) {
      red = pixels[at] ?? 0;
      green = pixels[at + 1] ?? 0;
      blue = pixels[at + 2] ?? 0;
      opacity = kind === 6 ? pixels[at + 3] ?? OPAQUE_ALPHA : OPAQUE_ALPHA;
    } else {
      const index = pixels[at] ?? 0;
      const entry = palette ? paletteOf(palette, index) : null;
      if (!entry) {
        return null;
      }
      [red, green, blue] = entry;
      opacity = alpha?.[index] ?? OPAQUE_ALPHA;
    }
    out[to] = red;
    out[to + 1] = green;
    out[to + 2] = blue;
    out[to + 3] = opacity;
  }
  return out;
}
function decodePng(bytes) {
  if (bytes.length <= PNG_HEAD_BYTES) {
    return null;
  }
  for (let i = 0;i < PNG_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      return null;
    }
  }
  let width = 0;
  let height = 0;
  let kind = 0;
  let palette = null;
  let alpha = null;
  const parts = [];
  let at = PNG_HEAD_BYTES;
  while (at + CHUNK_LENGTH_BYTES + CHUNK_TYPE_BYTES <= bytes.length) {
    const length = readU32(bytes, at);
    const type = String.fromCharCode(bytes[at + CHUNK_LENGTH_BYTES] ?? 0, bytes[at + CHUNK_LENGTH_BYTES + 1] ?? 0, bytes[at + CHUNK_LENGTH_BYTES + 2] ?? 0, bytes[at + CHUNK_LENGTH_BYTES + 3] ?? 0);
    const start = at + CHUNK_LENGTH_BYTES + CHUNK_TYPE_BYTES;
    const end = start + length;
    if (end > bytes.length) {
      break;
    }
    if (type === "IHDR") {
      width = readU32(bytes, start + IHDR_WIDTH);
      height = readU32(bytes, start + IHDR_HEIGHT);
      kind = bytes[start + IHDR_KIND] ?? 0;
      const depth = bytes[start + IHDR_DEPTH] ?? 0;
      const interlace = bytes[start + IHDR_INTERLACE] ?? 0;
      if (depth !== DEPTH_8 || interlace !== 0) {
        return null;
      }
    } else if (type === "PLTE") {
      palette = bytes.subarray(start, end);
    } else if (type === "tRNS") {
      alpha = bytes.subarray(start, end);
    } else if (type === "IDAT") {
      parts.push(bytes.subarray(start, end));
    } else if (type === "IEND") {
      break;
    }
    at = end + CRC_BYTES;
  }
  if (width <= 0 || height <= 0 || parts.length === 0) {
    return null;
  }
  let raw;
  try {
    raw = new Uint8Array(inflateSync(Buffer.concat(parts)));
  } catch {
    return null;
  }
  const channels = PNG_CHANNELS[kind];
  if (!channels) {
    return null;
  }
  const pixels = unfiltered(raw, width, height, channels);
  if (!pixels) {
    return null;
  }
  const data = rgbaOfPng(pixels, width, height, kind, palette, alpha);
  return data ? { width, height, data } : null;
}
function decodeJpeg(bytes) {
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255) {
    return null;
  }
  try {
    const image = import_jpeg_js.decode(bytes, { useTArray: true, maxMemoryUsageInMB: 96 });
    return image.width > 0 && image.height > 0 ? { width: image.width, height: image.height, data: image.data } : null;
  } catch {
    return null;
  }
}
function leadingColorOf(bytes) {
  const image = decodeJpeg(bytes) ?? decodePng(bytes);
  if (!image) {
    return null;
  }
  const step = Math.max(1, Math.ceil(Math.max(image.width, image.height) / SAMPLE_SIZE));
  const buckets = new Map;
  for (let y = 0;y < image.height; y += step) {
    for (let x = 0;x < image.width; x += step) {
      const index = (y * image.width + x) * RGBA_CHANNELS;
      if ((image.data[index + ALPHA_INDEX] ?? OPAQUE_ALPHA) < TRANSPARENT_ALPHA) {
        continue;
      }
      const r = image.data[index] ?? 0;
      const g = image.data[index + 1] ?? 0;
      const b = image.data[index + 2] ?? 0;
      const key = `${String(r >> BUCKET_SHIFT)}-${String(g >> BUCKET_SHIFT)}-${String(b >> BUCKET_SHIFT)}`;
      const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
  }
  let best = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) {
      best = bucket;
    }
  }
  return best ? `#${channelOf(best.r / best.count)}${channelOf(best.g / best.count)}${channelOf(best.b / best.count)}` : null;
}
async function colourOf(name) {
  const kept = await readFile(join2(mediaDirectory(), `${name}.color`), "utf8").catch(() => null);
  const stored = kept?.trim() ?? "";
  if (isColor(stored)) {
    return stored;
  }
  const bytes = await readFile(join2(mediaDirectory(), name)).catch(() => null);
  if (!bytes) {
    return null;
  }
  const hex = leadingColorOf(new Uint8Array(bytes));
  if (hex) {
    await writeFile(join2(mediaDirectory(), `${name}.color`), hex).catch(() => {
      return;
    });
  }
  return hex;
}
async function coloursOf(names) {
  const colours = {};
  for (const name of names) {
    if (!name || colours[name]) {
      continue;
    }
    const hex = await colourOf(name);
    if (hex) {
      colours[name] = hex;
    }
  }
  return colours;
}

// src/plugin.ts
var DEFAULT_PER_PAGE = 30;
var MIN_PER_PAGE = 5;
var MAX_PER_PAGE = 200;
var MAX_OVERVIEW = 600;
var MAX_EXTRACT = 1200;
var MAX_ROUNDS = 3;
function languageOf(archive) {
  return archive.replace(/wiki$/, "") || "en";
}
function perPageOf(value) {
  const wanted = typeof value === "number" ? Math.round(value) : DEFAULT_PER_PAGE;
  return Math.min(MAX_PER_PAGE, Math.max(MIN_PER_PAGE, wanted));
}
function pageOf(paging, perPage) {
  const limit = Math.min(MAX_PER_PAGE, Math.max(MIN_PER_PAGE, Math.round(paging?.limit ?? perPage)));
  return { offset: Math.max(0, Math.round(paging?.offset ?? 0)), limit };
}
async function catalogue(settings, paging) {
  const archive = archiveOf(settings.archive);
  const perPage = perPageOf(settings.perPage);
  const { offset, limit } = pageOf(paging, perPage);
  const language = languageOf(archive);
  const query2 = typeof settings.query === "string" ? settings.query : "";
  const seen = new Set;
  const items = [];
  let cursor = offset;
  let hasMore = false;
  for (let round = 0;round < MAX_ROUNDS && items.length < limit; round += 1) {
    const page = await readTitles(archive, {
      query: query2,
      offset: cursor,
      limit: limit - items.length
    });
    if (page.titles.length === 0) {
      hasMore = false;
      break;
    }
    const articles = await summaries(language, page.titles);
    const found = page.titles.map((title) => articles.get(title) ?? null);
    const covers = await keepStills(found.map((article) => article?.thumbnail ?? null));
    const colours = await coloursOf(covers);
    for (const [index, title] of page.titles.entries()) {
      const article = found[index] ?? null;
      const name = article?.title ?? title;
      const id = itemIdOf(name);
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      const cover = covers[index] ?? null;
      const extract = article?.extract ?? null;
      items.push({
        id,
        title: name,
        overview: extract ? extract.slice(0, MAX_OVERVIEW) : article?.description ?? null,
        cover,
        color: cover ? colours[cover] ?? null : null,
        url: pageUrl(language, name)
      });
    }
    cursor += page.titles.length;
    hasMore = page.hasMore;
    if (!hasMore) {
      break;
    }
  }
  return {
    kind: "wikipedia-catalogue",
    text: JSON.stringify({ items, known: [], hasMore, cursor })
  };
}
function itemIdOf(title) {
  return createHash2("sha256").update(title, "utf8").digest("hex");
}
function articleText(read) {
  const { language, article, backlinks: links } = read;
  const lines = [`# ${article.title}`];
  if (article.description) {
    lines.push("", `*${article.description}*`);
  }
  if (article.extract) {
    lines.push("", article.extract.slice(0, MAX_EXTRACT));
  }
  if (links.length > 0) {
    lines.push("", "## Linked from");
    for (const title of links) {
      lines.push(`- [${title}](${pageUrl(language, title)})`);
    }
  }
  lines.push("", `[Read on Wikipedia](${pageUrl(language, article.title)})`);
  return lines.join(`
`);
}
async function article(subject) {
  const read = await readArticle(subject?.link?.url);
  return {
    kind: "wikipedia-article",
    text: articleText(read)
  };
}
async function noteArticle(subject, settings) {
  if (subject?.link?.url) {
    return await article(subject);
  }
  const language = typeof settings.language === "string" && /^[a-z-]{2,16}$/.test(settings.language) ? settings.language : "en";
  const title = (subject?.title ?? "").trim();
  if (!title) {
    throw new PluginError("bad_subject", "This note has no title to look an article up by.");
  }
  const found = (await summaries(language, [title])).get(title);
  if (!found) {
    throw new PluginError("no_data", `Wikipedia has no article called \u201C${title}\u201D.`);
  }
  const links = await backlinks(language, found.title).catch(() => []);
  return {
    kind: "wikipedia-article",
    text: articleText({ language, article: found, backlinks: links })
  };
}
async function preview(subject) {
  const found = articleOf(subject?.link?.url);
  if (!found) {
    throw new PluginError("bad_subject", "This entry does not link to a Wikipedia article.");
  }
  const article2 = (await summaries(found.language, [found.title])).get(found.title);
  if (!article2) {
    throw new PluginError("no_data", "Wikipedia has no article by that name.");
  }
  return {
    kind: "link-preview",
    text: JSON.stringify({
      title: article2.title,
      description: article2.description ?? article2.extract?.slice(0, MAX_OVERVIEW) ?? null,
      imageUrl: article2.thumbnail
    })
  };
}
var plugin_default = () => serve(async ({ command, params }) => {
  if (command === "catalogue") {
    return await catalogue(params.settings ?? {}, params.paging);
  }
  if (command === "article") {
    return await article(params.subject);
  }
  if (command === "note-article") {
    return await noteArticle(params.subject, params.settings ?? {});
  }
  if (command === "preview") {
    return await preview(params.subject);
  }
  throw new PluginError("unsupported", `Unknown command ${command}.`);
});
export {
  itemIdOf,
  plugin_default as default
};
