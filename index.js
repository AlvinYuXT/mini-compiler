/**
 * 尝试做一个小的编译器
 * 实例代码转换(add 2 4) 转换到add(2, 4)
 * 第一步token化
 */

const LETTERS = /\w/i
const NUMBER = /\d/i
const WHITESPACE = /\s/i

/**
 *
 * Tokens might look something like this:
 *
 *   [
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'add'      },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'subtract' },
 *     { type: 'number', value: '4'        },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: ')'        },
 *     { type: 'paren',  value: ')'        },
 *   ]
 *
 * @param {*} input
 * @returns
 */
function tokenizer(input) {
    let tokens = []
    const length = input.length
    let i = 0
    while (i < length) {
        let letter = input[i]
        /* 处理特殊的标识符 */
        if (letter === '(') {
            tokens.push({
                type: 'paren',
                value: '('
            })
            i++
            continue
        }
        if (letter === ')') {
            tokens.push({
                type: 'paren',
                value: ')'
            })
            i++
            continue
        }
        /* 处理空白字符 */
        if (WHITESPACE.test(letter)) {
            i++
            continue
        }
        /* 处理数字参数 */
        if (NUMBER.test(letter)) {
            let value = ''
            while (NUMBER.test(letter)) {
                value += letter
                letter = input[++i]
            }
            tokens.push({
                type: 'number',
                value
            })
            continue
        }
        /* 处理字符参数 */
        if (letter === '"') {
            let value = ''
            letter = input[++i]
            while (letter !== '"') {
                value += letter
            }
            tokens.push({ type: 'string', value })
            continue
        }
        /* 处理函数名 */
        if (LETTERS.test(letter)) {
            let value = ''
            while (LETTERS.test(letter)) {
                value += letter
                letter = input[++i]
            }
            const token = {
                type: 'name',
                value: value
            }
            tokens.push(token)
            continue
        }
        throw new TypeError('I dont know what this character is: ' + letter)
    }
    return tokens
}

function parse(tokens) {
    const ast = {
        type: 'Program',
        body: []
    }
    const len = tokens.length
    let i = 0
    function walk() {
        while (i < len) {
            let token = tokens[i]
            // let node = {}
            // 处理数字
            if (token.type === 'number') {
                return {
                    type: 'NumberLiteral',
                    value: token.value
                }
            }
            if (token.type === 'string') {
                return {
                    type: 'StringLiteral',
                    value: token.value
                }
            }

            if (token.type === 'paren' && token.value === '(') {
                // 获取add
                token = tokens[++i]
                let node = {
                    type: 'CallExpression',
                    name: token.value,
                    params: []
                }
                token = tokens[++i]
                while (
                    token.type !== 'paren' ||
                    (token.type === 'paren' && token.value !== ')')
                ) {
                    node.params.push(walk())
                    token = tokens[++i]
                }
                return node
            }
            if (token.value === ')') {
                i++
            }
        }
    }
    ast.body.push(walk())
    return ast
}

/*
const ast = {
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
};
*/

function traverser(ast, visitor) {
    function transArray(array, parent) {
        array.forEach(node => {
            transNode(node, parent)
        })
    }

    function transNode(node, parent) {
        const methods = visitor[node.type]
        if (methods && methods.enter) {
            methods.enter(node, parent)
        }
        switch (node.type) {
            case 'Program':
                transArray(node.body, node)
                break
            case 'CallExpression':
                transArray(node.params, node)
                break
            case 'NumberLiteral':
            case 'StringLiteral':
                break
            default:
                break
        }
        if (methods && methods.exit) {
            methods.exit(node, parent)
        }
    }

    transNode(ast, null)
}

function transform(ast) {
    let newAst = {
        type: 'Program',
        body: []
    }

    ast._context = newAst.body

    traverser(ast, {
        NumberLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'NumberLiteral',
                    value: node.value
                })
            },
            exit(node, parent) {}
        },
        StringLiteral: {
            enter(node, parent) {
                parent._context.push({
                    type: 'StringLiteral',
                    value: node.value
                })
            },
            exit(node, parent) {}
        },
        CallExpression: {
            enter(node, parent) {
                let expression = {
                    type: 'CallExpression',
                    callee: {
                        type: 'Identifier',
                        name: node.name
                    },
                    arguments: []
                }

                node._context = expression.arguments

                if (parent.type !== 'CallExpression') {
                    expression = {
                        type: 'ExpressionStatement',
                        expression: expression
                    }
                }
                parent._context.push(expression)
            },
            exit(node, parent) {}
        }
    })

    return newAst
}

function codeGen(node) {
    switch (node.type) {
        case 'Program':
            return `${node.body.map(codeGen)};`
        case 'ExpressionStatement':
            return codeGen(node.expression)
        case 'CallExpression':
            const args = node.arguments.map(codeGen)
            return `${codeGen(node.callee)}(${args.join(', ')})`
        case 'Identifier':
            return node.name
        case 'NumberLiteral':
            return node.value
        case 'StringLiteral':
            return `'${node.value}'`
        default:
            break
    }
}

function compiler(input) {
    const tokens = tokenizer(input)
    const ast = parse(tokens)
    const newAst = transform(ast)
    const output =  codeGen(newAst)
    return output
}

module.exports = {
    tokenizer,
    parse,
    transform,
    codeGen,
    compiler
}
