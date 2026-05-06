/** @type {import('tailwindcss').Config} */
export default {
    prefix: '',
    darkMode: 'class',
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
    theme: {
        extend: {},
    },
    safelist: [
        {
            pattern: /(bg|text|border|ring|shadow)-(purple|blue|green|orange|pink|red)-(50|100|200|300|400|500|600|700|800|900)/,
            variants: ['hover', 'focus', 'dark', 'dark:hover', 'dark:focus'],
        },
        {
            pattern: /(bg|text|border|placeholder)-(gray)-(50|100|200|300|400|500|600|700|800|900)/,
            variants: ['hover', 'focus', 'dark', 'dark:hover', 'dark:focus'],
        }
    ],
    plugins: [],
}