## mini-compiler
This is a mini-compiler just turn `(add 2 (subtract 4 2))` into `add(3, subtract(4, 2));`

A compiler should have three phase:
- Parsing
- Transformation
- Code Generation

### Parsing
> 我为什么要写英文呢
Parsing 主要分为两个阶段：
- 词法分析(tokenizer) 主要将原始语言进行切分，获取tokens，有点类似于中文的且切词，对于多数语言 js等可以通过空格就可以简单的切分。
    ```javascript
    [
        { type: 'paren',  value: '('        },
        { type: 'name',   value: 'add'      },
        { type: 'number', value: '2'        },
        { type: 'paren',  value: '('        },
        { type: 'name',   value: 'subtract' },
        { type: 'number', value: '4'        },
        { type: 'number', value: '2'        },
        { type: 'paren',  value: ')'        },
        { type: 'paren',  value: ')'        }
    ];
    ```
- 语法分析(Parser) 根据上一步生成的tokens生成原始语言的AST，每一种语言都有自己的AST，本项目通过递归的方式生成AST树。
    ```javascript
    {
        type: 'Program',
        body: [{
            type: 'CallExpression',
            name: 'add',
            params: [{
            type: 'NumberLiteral',
            value: '2'
            }, {
            type: 'CallExpression',
            name: 'subtract',
            params: [{
                type: 'NumberLiteral',
                value: '4'
            }, {
                type: 'NumberLiteral',
                value: '2'
            }]
            }]
        }]
    }
    ```

### Transformation
这个过程就是讲原始语言的AST转换成目标语言的AST，本项目中采用的也是递归的方式，但是参数是通过引用的形式传递进去的，可Parse中的递归不同，parse中是直接return返回的。在这一个过程其实就是对树进行深度遍历的过程，可以在enter和exit节点的时候进行钩子函数处理。

### Code Generator
通过AST生成目标语言。没啥好说的了。