import { describe, it, expect } from "@jest/globals";
import {
  getItemSize,
  setItemSize,
  computeTotalSize,
  computeStartOffset,
  findStartIndexWithOffset,
  findEndIndex,
  Cache,
  hasUnmeasuredItemsInRange,
} from "./cache";
import type { Writeable } from "./types";
import { range } from "./utils";

const sum = (cache: readonly number[]): number => {
  return cache.reduce((acc, c) => acc + c, 0);
};

describe(getItemSize.name, () => {
  const sizes = [10, -1];
  const cache: Cache = {
    _length: sizes.length,
    _sizes: sizes,
    _measuredOffsetIndex: 0,
    _offsets: [0],
    _defaultItemSize: 20,
  };

  it("should get height", () => {
    expect(getItemSize(cache, 0)).toBe(10);
  });
  it("should get default height", () => {
    expect(getItemSize(cache, 1)).toBe(20);
  });
});

describe(setItemSize.name, () => {
  describe("with offsets not measured", () => {
    it("should set at first", () => {
      const filledSizes = range(10, () => 20);
      const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 0,
        _offsets: emptyOffsets,
        _defaultItemSize: 20,
      };

      setItemSize(cache, 0, 123);
      expect(cache._sizes).toEqual([123, 20, 20, 20, 20, 20, 20, 20, 20, 20]);
      expect(cache._offsets).toEqual([0, -1, -1, -1, -1, -1, -1, -1, -1, -1]);
      expect(cache._measuredOffsetIndex).toBe(0);
    });

    it("should set at middle", () => {
      const filledSizes = range(10, () => 20);
      const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 0,
        _offsets: emptyOffsets,
        _defaultItemSize: 20,
      };

      setItemSize(cache, 4, 123);
      expect(cache._sizes).toEqual([20, 20, 20, 20, 123, 20, 20, 20, 20, 20]);
      expect(cache._offsets).toEqual([0, -1, -1, -1, -1, -1, -1, -1, -1, -1]);
      expect(cache._measuredOffsetIndex).toBe(0);
    });

    it("should set at last", () => {
      const filledSizes = range(10, () => 20);
      const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 0,
        _offsets: emptyOffsets,
        _defaultItemSize: 20,
      };

      setItemSize(cache, emptyOffsets.length - 1, 123);
      expect(cache._sizes).toEqual([20, 20, 20, 20, 20, 20, 20, 20, 20, 123]);
      expect(cache._offsets).toEqual([0, -1, -1, -1, -1, -1, -1, -1, -1, -1]);
      expect(cache._measuredOffsetIndex).toBe(0);
    });
  });

  describe("with offsets measured", () => {
    it("should update measuredOffsetIndex if size is changed before measuredOffsetIndex", () => {
      const filledSizes = range(10, () => 20);
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 4,
        _offsets: [0, 10, 20, 30, 40, -1, -1, -1, -1, -1],
        _defaultItemSize: 20,
      };

      setItemSize(cache, 1, 123);
      expect(cache._sizes).toEqual([20, 123, 20, 20, 20, 20, 20, 20, 20, 20]);
      expect(cache._offsets).toEqual([0, 10, 20, 30, 40, -1, -1, -1, -1, -1]);
      expect(cache._measuredOffsetIndex).toBe(1);
    });

    it("should not update measuredOffsetIndex if size is changed at measuredOffsetIndex", () => {
      const filledSizes = range(10, () => 20);
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 4,
        _offsets: [0, 10, 20, 30, 40, -1, -1, -1, -1, -1],
        _defaultItemSize: 20,
      };

      setItemSize(cache, 4, 123);
      expect(cache._sizes).toEqual([20, 20, 20, 20, 123, 20, 20, 20, 20, 20]);
      expect(cache._offsets).toEqual([0, 10, 20, 30, 40, -1, -1, -1, -1, -1]);
      expect(cache._measuredOffsetIndex).toBe(4);
    });

    it("should not update measuredOffsetIndex if size is changed after measuredOffsetIndex", () => {
      const filledSizes = range(10, () => 20);
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 4,
        _offsets: [0, 10, 20, 30, 40, -1, -1, -1, -1, -1],
        _defaultItemSize: 20,
      };

      setItemSize(cache, 5, 123);
      expect(cache._sizes).toEqual([20, 20, 20, 20, 20, 123, 20, 20, 20, 20]);
      expect(cache._offsets).toEqual([0, 10, 20, 30, 40, -1, -1, -1, -1, -1]);
      expect(cache._measuredOffsetIndex).toBe(4);
    });
  });
});

describe(computeTotalSize.name, () => {
  it("should succeed if sizes is filled", () => {
    const filledSizes = range(10, () => 20);
    const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
    const cache: Writeable<Cache> = {
      _length: filledSizes.length,
      _sizes: filledSizes,
      _measuredOffsetIndex: 0,
      _offsets: emptyOffsets,
      _defaultItemSize: 30,
    };
    expect(computeTotalSize(cache)).toBe(sum(filledSizes));
    expect(cache._offsets).toEqual([
      0, 20, 40, 60, 80, 100, 120, 140, 160, 180,
    ]);
  });

  it("should succeed if sizes is not filled", () => {
    const emptySizes = range(10, () => -1);
    const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
    const cache: Writeable<Cache> = {
      _length: emptySizes.length,
      _sizes: emptySizes,
      _measuredOffsetIndex: 0,
      _offsets: emptyOffsets,
      _defaultItemSize: 30,
    };
    expect(computeTotalSize(cache)).toBe(sum(range(10, () => 30)));
    expect(cache._offsets).toEqual([
      0, 30, 60, 90, 120, 150, 180, 210, 240, 270,
    ]);
  });

  it("should return 0 if cache length is 0", () => {
    const filledSizes: number[] = [];
    const emptyOffsets: number[] = [];
    const cache: Writeable<Cache> = {
      _length: filledSizes.length,
      _sizes: filledSizes,
      _measuredOffsetIndex: 0,
      _offsets: emptyOffsets,
      _defaultItemSize: 30,
    };
    expect(computeTotalSize(cache)).toBe(0);
    expect(cache._offsets).toEqual([]);
  });

  describe("with cached offsets", () => {
    it("should start from cached offset if measuredOffsetIndex is at cached", () => {
      const filledSizes = range(10, () => 20);
      const offsets = [0, 11, 22, 33, -1, -1, -1, -1, -1, -1];
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 2,
        _offsets: offsets,
        _defaultItemSize: 30,
      };
      expect(computeTotalSize(cache)).toBe(sum(range(8, () => 20)) + 22);
      expect(cache._offsets).toEqual([
        0, 11, 22, 42, 62, 82, 102, 122, 142, 162,
      ]);
    });

    it("should return cached offset + 1 item size if measuredOffsetIndex is at end", () => {
      const filledSizes = range(10, () => 20);
      const offsets = [0, 11, 22, 33, 44, 55, 66, 77, 88, 99];
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 9,
        _offsets: offsets,
        _defaultItemSize: 30,
      };
      expect(computeTotalSize(cache)).toBe(99 + 20);
      expect(cache._offsets).toEqual([0, 11, 22, 33, 44, 55, 66, 77, 88, 99]);
    });
  });
});

describe(computeStartOffset.name, () => {
  it("should get 0 if index is at start", () => {
    const filledSizes = range(10, () => 20);
    const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
    const cache: Writeable<Cache> = {
      _length: filledSizes.length,
      _sizes: filledSizes,
      _measuredOffsetIndex: 0,
      _offsets: emptyOffsets,
      _defaultItemSize: 30,
    };
    expect(computeStartOffset(0, cache)).toBe(0);
    expect(cache._offsets).toEqual([0, -1, -1, -1, -1, -1, -1, -1, -1, -1]);
  });

  it("should get 1 item if index is at start", () => {
    const filledSizes = range(10, () => 20);
    const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
    const cache: Writeable<Cache> = {
      _length: filledSizes.length,
      _sizes: filledSizes,
      _measuredOffsetIndex: 0,
      _offsets: emptyOffsets,
      _defaultItemSize: 30,
    };
    expect(computeStartOffset(1, cache)).toBe(20);
    expect(cache._offsets).toEqual([0, 20, -1, -1, -1, -1, -1, -1, -1, -1]);
  });

  it("should get total - 1 item if index is at last", () => {
    const filledSizes = range(10, () => 20);
    const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
    const cache: Writeable<Cache> = {
      _length: filledSizes.length,
      _sizes: filledSizes,
      _measuredOffsetIndex: 0,
      _offsets: emptyOffsets,
      _defaultItemSize: 30,
    };
    const last = filledSizes.length - 1;
    expect(computeStartOffset(last, cache)).toBe(
      sum(filledSizes) - filledSizes[last]!
    );
    expect(cache._offsets).toEqual([
      0, 20, 40, 60, 80, 100, 120, 140, 160, 180,
    ]);
  });

  it("should resolve default height", () => {
    const emptySizes = range(10, () => -1);
    const emptyOffsets = range(10, (i) => (i === 0 ? 0 : -1));
    const cache: Writeable<Cache> = {
      _length: emptySizes.length,
      _sizes: emptySizes,
      _measuredOffsetIndex: 0,
      _offsets: emptyOffsets,
      _defaultItemSize: 30,
    };
    expect(computeStartOffset(2, cache)).toBe(60);
    expect(cache._offsets).toEqual([0, 30, 60, -1, -1, -1, -1, -1, -1, -1]);
  });

  describe("with cached offsets", () => {
    it("should return cached offset if index is before measuredOffsetIndex", () => {
      const filledSizes = range(10, () => 20);
      const offsets = [0, 11, 22, 33, -1, -1, -1, -1, -1, -1];
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 3,
        _offsets: offsets,
        _defaultItemSize: 30,
      };
      expect(computeStartOffset(2, cache)).toBe(22);
      expect(cache._offsets).toEqual([0, 11, 22, 33, -1, -1, -1, -1, -1, -1]);
    });

    it("should return cached offset if index is the same as measuredOffsetIndex", () => {
      const filledSizes = range(10, () => 20);
      const offsets = [0, 11, 22, 33, -1, -1, -1, -1, -1, -1];
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 3,
        _offsets: offsets,
        _defaultItemSize: 30,
      };
      expect(computeStartOffset(3, cache)).toBe(33);
      expect(cache._offsets).toEqual([0, 11, 22, 33, -1, -1, -1, -1, -1, -1]);
    });

    it("should start from cached offset if index is after measuredOffsetIndex", () => {
      const filledSizes = range(10, () => 20);
      const offsets = [0, 11, 22, 33, -1, -1, -1, -1, -1, -1];
      const cache: Writeable<Cache> = {
        _length: filledSizes.length,
        _sizes: filledSizes,
        _measuredOffsetIndex: 3,
        _offsets: offsets,
        _defaultItemSize: 30,
      };
      expect(computeStartOffset(5, cache)).toBe(33 + 20 * 2);
      expect(cache._offsets).toEqual([0, 11, 22, 33, 53, 73, -1, -1, -1, -1]);
    });
  });
});

describe(findEndIndex.name, () => {
  const filledSizes = range(10, () => 20);
  const cache: Cache = {
    _length: filledSizes.length,
    _sizes: filledSizes,
    _measuredOffsetIndex: 0,
    _offsets: [0],
    _defaultItemSize: 30,
  };

  describe("change index", () => {
    it("should get if index is at start", () => {
      expect(findEndIndex(0, 100, cache)).toBe(4);
    });

    it("should get if index is at start + 1", () => {
      expect(findEndIndex(1, 100, cache)).toBe(5);
    });

    it("should get last if index is at end", () => {
      const last = filledSizes.length - 1;
      expect(findEndIndex(last, 100, cache)).toBe(last);
    });

    it("should get if index is at end - 1", () => {
      const last = filledSizes.length - 1;
      expect(findEndIndex(last - 1, 100, cache)).toBe(last);
    });
  });

  it("should get argument index if viewport is 0 and index is at start", () => {
    expect(findEndIndex(0, 0, cache)).toBe(0);
  });

  it("should get argument index if viewport is 0 and index is at start + 1", () => {
    expect(findEndIndex(1, 0, cache)).toBe(1);
  });

  it("should get same if viewport fits cache", () => {
    expect(findEndIndex(1, 100, cache)).toBe(5);
  });

  it("should get next if viewport is 1/2 item height larger than cache", () => {
    expect(findEndIndex(1, 110, cache)).toBe(6);
  });

  it("should get same if viewport is 1/2 - 1px item height larger than cache", () => {
    expect(findEndIndex(1, 109, cache)).toBe(5);
  });

  it("should get same if viewport is bit larger than cache", () => {
    expect(findEndIndex(1, 101, cache)).toBe(5);
  });

  it("should get same if viewport is a little bit larger than cache", () => {
    expect(findEndIndex(1, 100.01, cache)).toBe(5);
  });

  it("should get same if viewport is bit smaller than cache", () => {
    expect(findEndIndex(1, 99, cache)).toBe(5);
  });

  it("should get same if viewport is a little bit smaller than cache", () => {
    expect(findEndIndex(1, 99.99, cache)).toBe(5);
  });

  it("should resolve default height", () => {
    const emptySizes = range(10, () => -1);
    const emptyCache: Cache = {
      _length: emptySizes.length,
      _sizes: emptySizes,
      _measuredOffsetIndex: 0,
      _offsets: [0],
      _defaultItemSize: 25,
    };
    expect(findEndIndex(0, 100, emptyCache)).toBe(3);
  });
});

describe(findStartIndexWithOffset.name, () => {
  it("should resolve default height", () => {
    const emptySizes = range(10, () => -1);
    const emptyCache: Cache = {
      _length: emptySizes.length,
      _sizes: emptySizes,
      _measuredOffsetIndex: 0,
      _offsets: [0],
      _defaultItemSize: 25,
    };

    expect(findStartIndexWithOffset(100, emptyCache, 0, 0)).toBe(4);
  });

  describe("start from start", () => {
    const filledSizes = range(10, () => 20);
    const cache: Cache = {
      _length: filledSizes.length,
      _sizes: filledSizes,
      _measuredOffsetIndex: filledSizes.length - 1,
      _offsets: [0],
      _defaultItemSize: 30,
    };

    it("should get start if offset is at start", () => {
      expect(findStartIndexWithOffset(0, cache, 0, 0)).toBe(0);
    });

    it("should get start if offset is at start + 1px", () => {
      expect(findStartIndexWithOffset(1, cache, 0, 0)).toBe(0);
    });

    it("should get end if offset is at end", () => {
      expect(findStartIndexWithOffset(sum(cache._sizes), cache, 0, 0)).toBe(
        cache._length - 1
      );
    });

    it("should get end if offset is at end - 1px", () => {
      expect(findStartIndexWithOffset(sum(cache._sizes) - 1, cache, 0, 0)).toBe(
        cache._length - 1
      );
    });

    it("should get 1 if offset fits index 1", () => {
      expect(findStartIndexWithOffset(20, cache, 0, 0)).toBe(1);
    });

    it("should get 1 if offset fits index 1 + 1px", () => {
      expect(findStartIndexWithOffset(21, cache, 0, 0)).toBe(1);
    });

    it("should get 1 if offset fits index 1 - 1px", () => {
      expect(findStartIndexWithOffset(19, cache, 0, 0)).toBe(1);
    });

    it("should get 1 if offset fits index 1.5", () => {
      expect(findStartIndexWithOffset(30, cache, 0, 0)).toBe(1);
    });

    it("should get 2 if offset fits index 1.5 + 1px", () => {
      expect(findStartIndexWithOffset(31, cache, 0, 0)).toBe(2);
    });

    it("should get 2 if offset fits index 1.5 + 0.01px", () => {
      expect(findStartIndexWithOffset(30.01, cache, 0, 0)).toBe(2);
    });

    it("should get 1 if offset fits index 1.5 - 1px", () => {
      expect(findStartIndexWithOffset(29, cache, 0, 0)).toBe(1);
    });

    it("should get 1 if offset fits index 1.5 - 0.01px", () => {
      expect(findStartIndexWithOffset(29.99, cache, 0, 0)).toBe(1);
    });

    it("should get 2 if offset fits index 2", () => {
      expect(findStartIndexWithOffset(40, cache, 0, 0)).toBe(2);
    });

    it("should get 2 if offset fits index 2 + 1px", () => {
      expect(findStartIndexWithOffset(41, cache, 0, 0)).toBe(2);
    });

    it("should get 2 if offset fits index 2 - 1px", () => {
      expect(findStartIndexWithOffset(39, cache, 0, 0)).toBe(2);
    });
  });

  describe("start from end", () => {
    const filledSizes = range(10, () => 20);
    const cache: Cache = {
      _length: filledSizes.length,
      _sizes: filledSizes,
      _measuredOffsetIndex: filledSizes.length - 1,
      _offsets: [0],
      _defaultItemSize: 30,
    };

    const offset = (i: number) => sum(cache._sizes.slice(0, i));

    it("should get start if offset is at start", () => {
      expect(
        findStartIndexWithOffset(0, cache, cache._length, offset(cache._length))
      ).toBe(0);
    });

    it("should get start if offset is at start + 1px", () => {
      expect(
        findStartIndexWithOffset(1, cache, cache._length, offset(cache._length))
      ).toBe(0);
    });

    it("should get end if offset is at end", () => {
      expect(
        findStartIndexWithOffset(
          offset(cache._length),
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(cache._length - 1);
    });

    it("should get end if offset is at end - 1px", () => {
      expect(
        findStartIndexWithOffset(
          offset(cache._length) - 1,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(cache._length - 1);
    });

    it("should get 1 if offset fits index 1", () => {
      expect(
        findStartIndexWithOffset(
          20,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(1);
    });

    it("should get 1 if offset fits index 1 + 1px", () => {
      expect(
        findStartIndexWithOffset(
          21,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(1);
    });

    it("should get 1 if offset fits index 1 - 1px", () => {
      expect(
        findStartIndexWithOffset(
          19,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(1);
    });

    it("should get 1 if offset fits index 1.5", () => {
      expect(
        findStartIndexWithOffset(
          30,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(1);
    });

    it("should get 2 if offset fits index 1.5 + 1px", () => {
      expect(
        findStartIndexWithOffset(
          31,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(2);
    });

    it("should get 2 if offset fits index 1.5 + 0.01px", () => {
      expect(
        findStartIndexWithOffset(
          30.01,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(2);
    });

    it("should get 1 if offset fits index 1.5 - 1px", () => {
      expect(
        findStartIndexWithOffset(
          29,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(1);
    });

    it("should get 1 if offset fits index 1.5 - 0.01px", () => {
      expect(
        findStartIndexWithOffset(
          29.99,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(1);
    });

    it("should get 2 if offset fits index 2", () => {
      expect(
        findStartIndexWithOffset(
          40,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(2);
    });

    it("should get 2 if offset fits index 2 + 1px", () => {
      expect(
        findStartIndexWithOffset(
          41,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(2);
    });

    it("should get 2 if offset fits index 2 - 1px", () => {
      expect(
        findStartIndexWithOffset(
          39,
          cache,
          cache._length,
          offset(cache._length)
        )
      ).toBe(2);
    });
  });

  describe("start from middle", () => {
    const filledSizes = range(10, () => 20);
    const cache: Cache = {
      _length: filledSizes.length,
      _sizes: filledSizes,
      _measuredOffsetIndex: filledSizes.length - 1,
      _offsets: [0],
      _defaultItemSize: 30,
    };

    const offset = (i: number) => sum(cache._sizes.slice(0, i));

    it("should get start if offset is at start", () => {
      expect(findStartIndexWithOffset(0, cache, 4, offset(4))).toBe(0);
    });

    it("should get end if offset is at end", () => {
      expect(
        findStartIndexWithOffset(sum(cache._sizes), cache, 4, offset(4))
      ).toBe(cache._sizes.length - 1);
    });

    it("should get prevStartIndex if offset fits prevStartIndex", () => {
      expect(findStartIndexWithOffset(offset(4), cache, 4, offset(4))).toBe(4);
    });

    it("should get prevStartIndex if offset fits prevStartIndex + 1px", () => {
      expect(findStartIndexWithOffset(offset(4) + 1, cache, 4, offset(4))).toBe(
        4
      );
    });

    it("should get prevStartIndex if offset fits prevStartIndex - 1px", () => {
      expect(findStartIndexWithOffset(offset(4) - 1, cache, 4, offset(4))).toBe(
        4
      );
    });
  });
});

describe(hasUnmeasuredItemsInRange.name, () => {
  it("should return false if all measured", () => {
    const sizes = [10, 10, 10, 10];
    const cache: Cache = {
      _length: sizes.length,
      _sizes: sizes,
      _measuredOffsetIndex: 0,
      _offsets: [0],
      _defaultItemSize: 30,
    };
    expect(hasUnmeasuredItemsInRange(0, sizes.length - 1, cache)).toBe(false);
  });

  it("should return true if start is not measured", () => {
    const sizes = [10, -1, 10, 10];
    const cache: Cache = {
      _length: sizes.length,
      _sizes: sizes,
      _measuredOffsetIndex: 0,
      _offsets: [0],
      _defaultItemSize: 30,
    };
    expect(hasUnmeasuredItemsInRange(1, 2, cache)).toBe(true);
  });

  it("should return true if end is not measured", () => {
    const sizes = [10, 10, -1, 10];
    const cache: Cache = {
      _length: sizes.length,
      _sizes: sizes,
      _measuredOffsetIndex: 0,
      _offsets: [0],
      _defaultItemSize: 30,
    };
    expect(hasUnmeasuredItemsInRange(1, 2, cache)).toBe(true);
  });
});
