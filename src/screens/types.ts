export type TabKey = 'home' | 'tenders' | 'nova' | 'alerts';

export type TenderFilter = 'active' | 'closing' | 'submitted' | 'decided' | 'all';

// Lets one tab send the user to another (e.g. an alert opening its tender).
export type Navigate = {
  openTab: (tab: TabKey) => void;
  openTender: (tenderId: string) => void;
  showTenders: (filter: TenderFilter) => void;
};
