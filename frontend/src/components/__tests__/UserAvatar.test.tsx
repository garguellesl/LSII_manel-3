import { fireEvent, render } from '@testing-library/react';
import { UserAvatar } from '../UserAvatar';

describe('UserAvatar', () => {
  it('shows the coloured initial when there is no picture', () => {
    const { container } = render(<UserAvatar name="ada" />);
    const avatar = container.querySelector('.user-avatar');
    expect(avatar).toHaveTextContent('A');
    expect(avatar).toHaveClass('user-avatar--small');
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('shows the uploaded picture as decoration and falls back to the initial if it cannot load', () => {
    const { container } = render(<UserAvatar name="ada" src="/media/uploads/avatars/a.png" size="large" />);
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', expect.stringContaining('/uploads/avatars/a.png'));
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveClass('user-avatar--large');

    fireEvent.error(image as HTMLImageElement);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('.user-avatar')).toHaveTextContent('A');
  });
});
