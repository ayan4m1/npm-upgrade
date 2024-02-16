import Table from 'cli-table';

const COL_ALIGNS_MAP = {
  l: 'left',
  r: 'right',
  c: 'middle'
};

const EMPTY_BORDER_CHARS = {
  top: '',
  'top-mid': '',
  'top-left': '',
  'top-right': '',
  bottom: '',
  'bottom-mid': '',
  'bottom-left': '',
  'bottom-right': '',
  left: '',
  'left-mid': '',
  mid: '',
  'mid-mid': '',
  right: '',
  'right-mid': '',
  middle: ''
};

export function createSimpleTable(rows = [], opts = {}) {
  if (opts.colAligns) {
    opts.colAligns = opts.colAligns.split('').map((val) => COL_ALIGNS_MAP[val]);
  }

  const table = new Table({
    style: { 'padding-left': 2 },
    colAligns: ['left', 'right', 'right', 'right', 'middle'],
    chars: EMPTY_BORDER_CHARS,
    ...opts
  });

  table.push(...rows);

  return table;
}
