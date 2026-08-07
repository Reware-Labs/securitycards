# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: memory safety

## memory safety

### Enable Engine Sanitizers During Debug Testing for Memory Safety

**Use when**

Compiling and testing unoptimized Flutter Engine debug builds to catch native memory safety flaws such as buffer overflows and use-after-free.

**Secure rules**

**Rule 1: Enable engine sanitizers during debug testing to catch memory errors.**

Enable Address Sanitizer (--asan), Memory Sanitizer (--msan), Undefined Behavior Sanitizer (--ubsan), or Thread Sanitizer (--tsan) when compiling and testing unoptimized Flutter Engine debug builds to catch native memory safety flaws before release.

```bash
./flutter/tools/gn --runtime-mode debug --asan --unoptimized --no-goma
autoninja -C out/host_debug_unopt
source ./flutter/testing/sanitizer_suppressions.sh
./out/host_debug_unopt/embedder_unittests
```
