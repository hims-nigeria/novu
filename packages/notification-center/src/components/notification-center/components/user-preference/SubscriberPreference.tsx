import React, { useLayoutEffect } from 'react';
import { Accordion, ScrollArea } from '@mantine/core';
import { css, cx } from '@emotion/css';

import { useNovuTheme, useFetchUserPreferences, useNovuContext } from '../../../../hooks';
import { accordionStyles } from './styles';
import image from '../../../../images/no-settings.webp';
import { useStyles } from '../../../../store/styles';
import { UserPreferenceItem } from './UserPreferenceItem';
import { Loader } from '../Loader';

const rootClassName = css`
  padding: 15px;
`;

export function SubscriberPreference() {
  const { setFetchingStrategy } = useNovuContext();
  const { theme, common } = useNovuTheme();
  const { data, isLoading: arePreferencesLoading } = useFetchUserPreferences();
  const [rootStyles, accordionItemStyles, accordionContentStyles, accordionControlStyles, accordionChevronStyles] =
    useStyles(['preferences.root', 'accordion.item', 'accordion.content', 'accordion.control', 'accordion.chevron']);

  const baseTheme = theme?.userPreferences;
  const preferences = data
    ?.filter((item) => !item.template.critical)
    ?.filter((pref) => Object.keys(pref.preference.channels).length > 0);
  const styles = accordionStyles(baseTheme, common.fontFamily);
  const accordionClassNames: Record<'item' | 'content' | 'control' | 'chevron', string> = {
    item: css(accordionItemStyles),
    content: css(accordionContentStyles),
    control: css(accordionControlStyles),
    chevron: css(accordionChevronStyles),
  };
  const showNoSettings = !arePreferencesLoading && preferences?.length === 0;

  useLayoutEffect(() => {
    setFetchingStrategy({ fetchUserPreferences: true });
  }, [setFetchingStrategy]);

  return arePreferencesLoading ? (
    <Loader />
  ) : (
    <>
      {showNoSettings ? (
        <div
          style={{
            textAlign: 'center',
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={image as any} alt="logo" style={{ maxWidth: 300 }} />
        </div>
      ) : (
        <ScrollArea style={{ height: 400 }}>
          <div className={cx('nc-preferences-root', rootClassName, css(rootStyles))}>
            <Accordion chevronPosition="right" styles={styles} classNames={accordionClassNames}>
              {preferences?.map((preference) => (
                <UserPreferenceItem key={preference.template._id} preferenceSettings={preference} />
              ))}
            </Accordion>
          </div>
        </ScrollArea>
      )}
    </>
  );
}
