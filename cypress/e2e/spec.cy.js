describe('template spec', () => {

  const testAccount = (accountFixture) => {
    cy.visit('http://localhost:3001');
    cy.fixture(accountFixture).then((userFixture) => {
      cy.setClipboard(JSON.stringify(userFixture));
      cy.get('[data-cy="paste-data"]').click();
      cy.get('[data-cy="nav-item-dashboard"]').click();
      cy.get('[data-cy*="character-"]');
      cy.get('[data-cy="nav-item-account/misc/general"]').click();
      cy.get('[data-cy="world 1"]').click();
      cy.get('[data-cy="anvil"]').click();
      cy.get('[data-cy*="player-name-"]');
    });
  };

  it('first account', () => {
    testAccount('first.json');
  });

  it('second account', () => {
    testAccount('second.json');
  });

  it('third account', () => {
    testAccount('third.json');
  });

  it('fourth account', () => {
    testAccount('fourth.json');
  });
});