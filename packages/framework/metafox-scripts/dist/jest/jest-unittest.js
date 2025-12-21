import jest from 'jest';
import jestConfig from './jestConfig.js';
export default function jestUnitTest() {
    process.env.BABEL_ENV = 'test';
    process.env.NODE_ENV = 'test';
    process.env.PUBLIC_URL = '';
    jest.run(['--config', JSON.stringify(jestConfig)]);
}
