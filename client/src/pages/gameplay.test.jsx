import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../api/client';
import CreateMystery from './CreateMystery';
import InvestigationRoom from './InvestigationRoom';
import Accusation from './Accusation';
vi.mock('../api/client', () => ({
  api: { create: vi.fn(), get: vi.fn(), discover: vi.fn(), hint: vi.fn(), accuse: vi.fn() },
}));
beforeEach(() => vi.resetAllMocks());
function mount(element, path, route) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={element} />
        <Route path="/case/:id/result" element={<p>Completed result</p>} />
        <Route
          path="/case/:id"
          element={route === '/case/:id' ? element : <p>Investigation loaded</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}
const data = {
  id: 'abc',
  title: 'The Test Case',
  difficulty: 'easy',
  story: 'An unexplained disappearance.',
  status: 'active',
  score: { current: 0 },
  progress: { cluesFound: 0, cluesTotal: 1, hintsUsed: 0, hintsTotal: 1 },
  hints: { total: 1, used: 0, revealed: [] },
  suspects: [
    {
      id: 's1',
      name: 'Clara Vale',
      role: 'Curator',
      description: 'A careful curator.',
      alibi: 'In the archive.',
    },
  ],
  clues: [{ id: 'c1', label: 'A letter', location: 'Desk', discovered: false }],
};
it('validates premise and preserves it after generation fails', async () => {
  api.create.mockRejectedValue(new Error('The agency is busy.'));
  mount(<CreateMystery />, '/create', '/create');
  const button = screen.getByRole('button', { name: /generate mystery/i });
  expect(button).toBeDisabled();
  fireEvent.change(screen.getByRole('textbox', { name: /your mystery premise/i }), {
    target: { value: 'A stolen compass at midnight' },
  });
  fireEvent.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('The agency is busy.');
  expect(screen.getByRole('textbox', { name: /your mystery premise/i })).toHaveValue(
    'A stolen compass at midnight',
  );
  expect(api.create).toHaveBeenCalledWith({
    premise: 'A stolen compass at midnight',
    difficulty: 'medium',
  });
});
it('reveals evidence and updates score only after the server responds', async () => {
  api.get.mockResolvedValue({ case: data });
  let finish;
  api.discover.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  mount(<InvestigationRoom />, '/case/abc', '/case/:id');
  fireEvent.click(await screen.findByRole('button', { name: /investigate/i }));
  expect(screen.queryByText('A hidden letter proves the timeline.')).not.toBeInTheDocument();
  finish({
    clue: { ...data.clues[0], discovered: true, text: 'A hidden letter proves the timeline.' },
    progress: { ...data.progress, cluesFound: 1 },
    score: { current: 5 },
  });
  expect(await screen.findByText('A hidden letter proves the timeline.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /investigate/i })).not.toBeInTheDocument();
});
it('requires a suspect selection and explicit confirmation before accusation', async () => {
  api.get.mockResolvedValue({ case: data });
  api.accuse.mockResolvedValue({ result: {} });
  mount(<Accusation />, '/case/abc/accuse', '/case/:id/accuse');
  expect(await screen.findByRole('button', { name: /confirm accusation/i })).toBeDisabled();
  fireEvent.click(screen.getByRole('radio'));
  fireEvent.click(screen.getByRole('button', { name: /confirm accusation/i }));
  expect(api.accuse).not.toHaveBeenCalled();
  const buttons = screen.getAllByRole('button', { name: /confirm accusation/i });
  fireEvent.click(buttons[buttons.length - 1]);
  await waitFor(() => expect(api.accuse).toHaveBeenCalledWith('abc', 's1'));
  expect(await screen.findByText('Completed result')).toBeInTheDocument();
});
