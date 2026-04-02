
export default {
    prefix: '',
    darkMode: 'class',
    content: ["./src*.{js,jsx,ts,tsx}", "./index.html"],
    theme: {
        extend: {},
    },
    safelist: [
        {
            pattern: /(bg|text|border|ring|shadow)-(purple|blue|green|orange)-(50|400|500|600|700|900)/,
            variants: ['hover', 'focus', 'dark'],
        },
        {
            pattern: /(bg|text|border)-(gray)-(50|100|200|300|400|500|600|700|800|900)/,
            variants: ['dark', 'hover'],
        }
    ],
    plugins: [],
}