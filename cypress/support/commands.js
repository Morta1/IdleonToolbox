/// <reference types="cypress" />
// @ts-ignore

Cypress.Commands.add('setClipboard', (text) => {
  cy.window().then((win) => {
    // Ensure the document is focused
    win.focus();
    // Attempt to write to the clipboard
    return win.navigator.clipboard.writeText(text)
      .then(() => {
        cy.log('Clipboard text set to:', text);
      })
      .catch((err) => {
        cy.log('Failed to set clipboard text:', err.message);
      });
  });
});

Cypress.Commands.add('dataCy', (selector) => cy.get(`[data-cy="${selector}"`))