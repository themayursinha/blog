---
layout: post
title: "x86 from the Metal Up"
date: 2019-04-30
categories: [security, engineering, architecture]
tags: [architecture, x86, assembly, security, malware-analysis, exploit-development]
description: "Everything you need to read an exploit, analyze malware, or understand what a disassembler is telling you — without learning every instruction in the manual."
share-img: /img/x86-register-layout.svg
subtitle: "Bits, bytes, registers, flags, and the few instructions that explain 80% of what you will see in any disassembler."
---

Every shellcode analysis starts with the same five-minute orientation. Read the registers, read the flags, find the loop, follow the jump. Once you can do that, the rest of x86 is just vocabulary. This is the orientation.

The only prerequisite is to know the basics of a C-family language. Everything else — what a register is, what a flag is, why the stack grows backwards — is below. The order matters: each section assumes the one above it.

## The data types

x86 deals in four sizes: bits, bytes, words, and double words.

A bit is a 0 or a 1. Eight bits make a byte, which holds 0 to 255. Two bytes make a word, which holds 0 to 65,535. Two words (four bytes, 32 bits) make a dword, which holds 0 to 4,294,967,295. Every register, every memory address, every instruction operand in 32-bit x86 is one of these four sizes. Once you internalize the size table, half the disassembler stops looking like noise.

## Registers

A register is a tiny storage cell on the CPU itself. Faster than main memory by an order of magnitude, limited in number, addressed by name rather than by address. The 32-bit x86 architecture gives you eight general-purpose registers, and Intel's original engineers had specific uses in mind for each — the names are the hint.

{% include figure.html src="/img/x86-register-layout.svg" label="Fig. 1 · x86 Register Layout" caption="Eight 32-bit general-purpose registers, their 16-bit sub-registers, and the four that also split into 8-bit halves. The colour groups follow the original Intel intent: EAX/EBX/ECX/EDX for arithmetic and data, ESI/EDI for string and pointer operations, EBP/ESP for stack frame management." alt="x86 general purpose register map: EAX, EBX, ECX, EDX, ESI, EDI, EBP, ESP with their 16-bit and 8-bit sub-registers" %}

Two of them are special. **EBP** and **ESP** are the base pointer and stack pointer — the two registers that own the function call machinery. Every modern compiler reserves them. You can technically use them as general-purpose registers, but the moment a function forgets to save and restore the original value, the entire stack frame collapses and the program crashes in ways that are nearly impossible to debug. If you ever see someone using EBP or ESP outside compiler-generated code, assume they are writing the kind of assembly that requires a debugger open at all times.

The other six are fair game, though the first four still have the strongest conventions. `EAX` is the accumulator — most arithmetic operations place their result there. `ECX` is the counter — `LOOP` decrements it, `REP` chains through it. `EDX` is the data register — the upper half of multiplication and division results. `EBX` is the base register — the only general-purpose register that survived the 16-bit era unchanged. `ESI` and `EDI` are the source and destination index registers — they walk through memory during string and buffer operations.

Every 32-bit register is a full 32 bits wide, but the lower 16 bits of each have their own two-letter name (`AX`, `BX`, `CX`, `DX`, `SI`, `DI`, `BP`, `SP`) for backward compatibility with 16-bit code. The first four of those 16-bit registers go one step further: the lower 8 bits are `AL`, `BL`, `CL`, `DL` and the upper 8 bits are `AH`, `BH`, `CH`, `DH`. When a disassembler shows you `mov al, 0x41` instead of `mov eax, 0x41`, the author is being precise about which byte they care about. Watch for it.

## Flags

Beside the eight general-purpose registers, the CPU maintains a single register of one-bit flags. Each flag is a tiny status signal that the most recent operation set or cleared. Most instructions touch at least one. The four that matter for almost every binary you will ever read:

- **Z** — zero flag, set when the result of the last operation is zero
- **S** — sign flag, set when the result is interpreted as negative
- **O** — overflow flag, set when the result switches the most significant bit
- **C** — carry flag, set when the most significant bit is carried out

The flags exist so that conditional jumps can ask questions. `JE` (jump if equal) checks Z. `JG` (jump if greater) checks S, O, and Z together. `JLE` (jump if less or equal) checks the same three. There are roughly 30 conditional jumps, none of which you have to memorize. The Intel manuals list which flags each one checks. Read the table once, look it up the next 200 times you need it.

The other register that matters is **EIP**, the extended instruction pointer. It points to the next instruction the CPU will execute, and every `JMP`, `CALL`, and `RET` instruction modifies it. EIP is the needle on a record player — the rest of the registers are the song.

## Segments and the memory model

Every running program is divided into four memory regions. The **.text** segment holds the program code. The **.data** segment holds global variables. The **.stack** segment holds local variables, function arguments, and return addresses. The **.heap** segment is where dynamic allocations live, shared across all threads in the process.

The stack is the part you need to understand. It is a Last In, First Out structure that grows backwards — from the highest memory address toward the lowest. The two registers that own it are `ESP`, which always points to the top of the stack, and `EBP`, which marks the start of the current function's frame. When a function is called, the caller's return address is pushed onto the stack, the callee's local variables are pushed on top of that, and `EBP` is set to point at the new frame. When the function returns, the stack unwinds and `ESP` is restored. The entire mechanism is implemented by two instructions: `CALL` (push return address, jump) and `RET` (pop return address, jump). The prologue and epilogue of every compiled function exist to keep this dance orderly.

The heap is the opposite — a linked list of free and allocated blocks, managed by `malloc` and `free` (or their C++ and OS equivalents). Exploit writers care about the heap because heap overflows corrupt the linked-list metadata and let attackers redirect execution. Defenders care because heap corruption is the most common class of memory-safety bug in modern software.

## Instructions

x86 instructions vary in length from one byte to fourteen bytes. Every instruction begins with an opcode — the operation code that tells the CPU what to do — and may be followed by zero, one, two, or three operands. Most instructions take two operands, like `add eax, ebx`. A few take one, like `not eax`. A few take three, like `imul eax, edx, 64`. The source operand can be a register, a memory address, or an immediate value. The destination can be a register or a memory address. You cannot have two memory addresses in the same instruction — the CPU has no instruction format for that — so any two-operand instruction with a memory reference must use a register as the other operand.

When a disassembler prints `dword ptr [eax]`, the brackets mean "the double word at the memory address currently in `eax`." The `dword` says it is reading 4 bytes. The `ptr` says it is a pointer dereference. Together, the expression means "fetch the 32-bit value from memory at the address `eax` is holding." The opposite — the address of a memory location, rather than its contents — is what `LEA` (load effective address) computes. `lea eax, [ecx+edx]` puts the *address* `ecx+edx` into `eax` without reading from that address. The arithmetic happens on the address itself, which is why compilers use it as a fast way to add two registers.

Bytes in memory are stored in **little-endian** order. The least significant byte of a value is stored first. If you write `mov eax, 0x12345678` and then look at the bytes in memory, you will see `78 56 34 12`, not `12 34 56 78`. This is the single most common source of "the bytes don't match" confusion when reading shellcode. It is not a bug. It is the architecture. Get used to reading hex dumps backward.

## The instructions that matter

The full x86 manual runs to thousands of pages. The instructions you will see in 90% of disassembly, in order of frequency:

**Data moving.** `MOV` is the most common instruction in any compiled program — it copies a value from source to destination. `MOVSX` and `MOVZX` extend a smaller value to a larger one, filling the new bits with the sign bit or with zeros respectively.

```x86asm
mov eax, 0x41          ; load the immediate value 0x41 into eax
mov ebx, [esp]         ; load the dword at the top of the stack into ebx
movzx eax, byte [esi]  ; load a single byte from [esi], zero-extend into eax
lea eax, [ecx+edx*4+8] ; compute the address ecx+edx*4+8, store in eax
```

**Arithmetic.** `ADD` and `SUB` are the obvious ones. `MUL` and `IMUL` multiply, with the result in `EDX:EAX` for the unsigned-without-operand form. `DIV` and `IDIV` divide, with the quotient in `EAX` and the remainder in `EDX`.

```x86asm
mov eax, 65            ; dividend
mov ecx, 4             ; divisor
div ecx                ; eax = 16, edx = 1 (remainder)
```

**Bitwise.** `AND`, `OR`, `XOR`, `NOT`. Two pieces of data, compared bit by bit. `XOR` is the interesting one — any value XORed with itself becomes 0, which is why compilers zero a register with `xor eax, eax` instead of `mov eax, 0`. The XOR path is one byte shorter and one cycle faster on most CPUs.

```x86asm
xor eax, eax           ; eax = 0, faster than "mov eax, 0"
and eax, 0xFF          ; keep only the low byte of eax
or  eax, 0x100         ; set bit 8 of eax
not eax                ; flip every bit of eax
```

**Branching.** `JMP` is unconditional. The conditional jumps check flags set by a previous instruction, almost always `CMP` (compare) or `TEST` (bitwise AND that discards the result, used for checking single bits).

```x86asm
cmp eax, ebx
je  .equal             ; jump if eax == ebx
jg  .greater           ; jump if eax > ebx (signed)
jbe .not_greater       ; jump if eax <= ebx (unsigned)
```

**Looping.** The `LOOP` instruction decrements `ECX` and jumps to the target if `ECX` is not zero. It is a relic of the 16-bit era, rarely generated by modern compilers, but it shows up in hand-written assembly and shellcode. The `REP` prefix is more interesting — it repeats the following string operation (`MOVS`, `STOS`, `CMPS`, `SCAS`) `ECX` times.

```x86asm
mov ecx, 5
_proc:
  dec ecx
  loop _proc           ; loops 5 times
```

## The mental model

Once the above is internalized, almost every disassembled function follows the same shape. A prologue saves the old `EBP` and sets up a new frame. The body loads arguments, does work, branches based on conditions, and moves results into `EAX` to return. An epilogue restores the old `EBP` and returns.

The exceptions are interesting. Loops and function calls use `ECX` and the stack, not `EAX`. String operations use `ESI` and `EDI` as source and destination. Some compilers will use any register for any purpose, especially with optimization enabled, which is why disassembly without symbols is genuinely hard. But the model holds often enough that it is the right starting point.

The deeper instruction set — `LOOP`, `REP`, `MOVZX`, the floating-point `FPU` stack, the `MMX`/`SSE`/`AVX` vector instructions, the `AES-NI` and `SHA-NI` hardware-accelerated crypto — is for later. None of it changes the mental model. The mental model is: registers are 32-bit scratchpads, flags are tiny status signals, the stack is a LIFO that grows downward, memory is byte-addressed little-endian, and the instruction pointer walks through the program one instruction at a time. Everything else is vocabulary on top of that.
