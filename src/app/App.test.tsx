import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from './App';
test('presents a labelled login form and no private documents without a session',()=>{
 render(<App/>);
 expect(screen.getByLabelText('Telefone')).toBeVisible();
 expect(screen.getByLabelText('Senha')).toBeVisible();
 expect(screen.getByRole('button',{name:'Entrar'})).toBeVisible();
 expect(screen.queryByRole('navigation',{name:'Principal'})).not.toBeInTheDocument();
});
