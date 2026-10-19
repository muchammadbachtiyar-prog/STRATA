import React from 'react';
import * as Icons from 'lucide-react';

export const Icon = React.memo(({ name, size = 18, className = "", strokeWidth = 2 }) => {
  // Map kebab-case to PascalCase
  let pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Handle exceptions
  if (name === 'user-circle2') {
    pascalName = 'UserCircle';
  } else if (name === 'check-circle-2') {
    pascalName = 'CheckCircle2';
  } else if (name === 'clock-3') {
    pascalName = 'Clock3';
  }
  
  const IconComponent = Icons[pascalName] || Icons.HelpCircle;
  
  return (
    <IconComponent 
      size={size} 
      className={className} 
      strokeWidth={strokeWidth} 
    />
  );
});

Icon.displayName = 'Icon';
