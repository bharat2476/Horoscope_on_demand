import { Dropdown, type DropdownOption } from '@/components/dropdown';

type FilterBarProps = {
  label: string;
  options: readonly DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
};

export function FilterBar({ label, options, selectedId, onSelect, placeholder }: FilterBarProps) {
  return (
    <Dropdown
      label={label}
      options={options}
      selectedId={selectedId}
      onSelect={onSelect}
      placeholder={placeholder}
    />
  );
}
