import classNames from 'classnames';
import React from 'react';

interface PropsErrorNotification {
  message: string;
  onClose: () => void;
}

export const ErrorNotification: React.FC<PropsErrorNotification> = ({
  message,
  onClose,
}) => {
  return (
    <div
      data-cy="ErrorNotification"
      className={classNames(
        'notification',
        'is-danger',
        'is-light',
        'has-text-weight-normal',
        { hidden: !message },
      )}
    >
      <button
        data-cy="HideErrorButton"
        type="button"
        className="delete"
        onClick={onClose}
      />
      {message}
    </div>
  );
};
