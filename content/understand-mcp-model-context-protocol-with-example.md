---
title: "Understand MCP (Model Context Protocol) with example"
author:  
tags: mcp, genai, programming, ai
canonical_url: https://dev.to/vivekyadav200988/understand-mcp-model-context-protocol-with-example-2chl
cover_image: https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fh2dkerfuooa7n27ebt4j.png
published: true
date: 2025-06-24
description: A practical guide to the Model Context Protocol (MCP) — how it enables AI agents to discover and call external tools securely, with architecture overview and a working arithmetic tools example.
---

Modern AI systems are shifting from static chatbots to interactive, tool-augmented agents. The Model Context Protocol (MCP) is an open protocol designed to standardize how models discover and use external tools securely and dynamically. Developed collaboratively by OpenAI, Anthropic, Google, and others, MCP enables large language models (LLMs) to interact with real-world systems like databases, APIs, and files—while maintaining modularity and security.

## 🧠 What is MCP?

MCP (Model Context Protocol) allows AI agents to call tools exposed via a structured interface (like HTTP + JSON-RPC) without needing to know their implementation details. An AI model can:

- Discover available tools
- Call tools dynamically
- Use the tool output to inform its next steps
- Do all this through a secure, well-defined interface

## 🧱 MCP Architecture Overview

![MCP Architecture](https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fp9wcnu5vyuqr47wfn2o3.png)

## 📦 Key Components

| Component | Description |
|-----------|-------------|
| MCP Server | Hosts tools (file read, database query, etc.) that conform to the MCP spec |
| MCP Client | Translates model requests into MCP tool calls |
| LLM (e.g. Ollama llama3.2) | The language model that plans and decides what tools to call |
| Chat UI | Human-facing frontend to drive conversation and display model output |

## 🧪 Sample Use Case: AI Assistant with Arithmetic Tools

Code is available in [repo](https://github.com/vcse59/Generative-AI-MCP-Application)

- Chat with an LLM assistant
- The assistant can perform arithmetic operations
- This is all done via tool invocation through MCP

## 🔚 Conclusion

MCP is revolutionizing how LLMs interact with the outside world. It enables modular, secure, and dynamic AI experiences. With just a few lines of code, you can build AI systems that see, act, and respond based on real-time tools.
