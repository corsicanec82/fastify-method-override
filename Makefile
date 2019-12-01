install:
	npm install

build:
	npm run build

lint:
	npx eslint .

publish:
	npm publish

test:
	npm test

test-coverage:
	npm test -- --coverage
