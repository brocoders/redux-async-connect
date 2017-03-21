module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "mocha": true,
    },
    "extends": "eslint-config-airbnb",
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 6,
    },
    "plugins": [
        "react",
        "import",
    ],
    "rules": {
        "arrow-body-style": 0,
        "arrow-parens": 0,
        "comma-dangle": 0,
        "import/no-named-as-default": 0,
        "import/no-named-as-default-member": 0,
        "import/extensions": 0,
        "import/first": 0,
        "import/no-unresolved": 0,
        "max-len": 0,
        "no-console": 0,
        "no-param-reassign": 0,
        "no-plusplus": 0,
        "no-restricted-syntax": 0,
        "object-curly-spacing": 0,
        "prefer-const": 0,
        "react/forbid-prop-types": 0,
        "react/jsx-filename-extension": 0,
        "react/no-unused-prop-types": 0,
        "react/require-default-props": 0,
        "react/sort-comp": 0,
    },
    "settings": {
        "import/parser": "babel-eslint",
        "import/resolve": {
            "moduleDirectory": [
                "node_modules",
                "src",
            ],
        },
    },
};
