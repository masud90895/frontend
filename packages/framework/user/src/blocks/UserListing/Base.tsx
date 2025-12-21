/**
 * @type: block
 * name: user.block.userListingBlock
 * title: User Items
 * keywords: user
 * description: Display user items with online filtering
 * thumbnail:
 */
import {
  getPagingSelector,
  GlobalState,
  initPagingState,
  ListViewPaginationProps,
  PagingState,
  useGlobal,
  getItemSelector,
  withPagination
} from '@metafox/framework';
import { Block, BlockContent, BlockHeader } from '@metafox/layout';
import { Grid, Box, Button } from '@mui/material';
import { isArray, range, get } from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { Pagination } from '@metafox/ui';
import { UserStatusType } from '@metafox/ui/UserAvatar';

type FilterType = 'all' | 'girls' | 'boys' | 'admins';

function ListViewPagination({
  title,
  itemView,
  itemProps = {},
  gridItemProps = {},
  gridContainerProps = { spacing: 2 },
  pagingId,
  messagePagination,
  handleUpdateLastRead,
  loadMore,
  numberOfItemsPerPage,
  emptyPage = 'core.block.no_content',
  emptyPageProps,
  errorPage,
  hasSort = false,
  moduleName,
  resourceName,
  actionSortName,
  handleActionItem,
  hideTopPagination,
  hideBottomPagination
}: ListViewPaginationProps) {
  const { jsxBackend, usePageParams, i18n } = useGlobal();
  const pageParams = usePageParams();
  const { page } = pageParams;
  const ItemView = jsxBackend.get(itemView);
  const Skeleton = jsxBackend.get(`${itemView}.skeleton`);
  const currentPageInitial = parseInt(page || 1, 10);

  const limitSkeleton = numberOfItemsPerPage;

  const [currentPage, setCurrentPage] =
    React.useState<number>(currentPageInitial);
  const [activeFilter, setActiveFilter] = React.useState<FilterType>('all');

  const paging =
    useSelector<GlobalState, PagingState>((state: GlobalState) =>
      getPagingSelector(state, pagingId)
    ) || initPagingState();

  const { loading, refreshing, error, ended, initialized, pagesOffset, dirty } =
    paging ?? {};
  const perPage = numberOfItemsPerPage || 20;

  // Try to get data from paging.pages[currentPage] first, fallback to paging.ids if pages is empty
  const allData = React.useMemo(() => {
    const pageData = paging.pages[currentPage]?.ids;

    if (pageData && pageData.length > 0) {
      return pageData;
    }

    // Fallback: if pages is empty, use paging.ids (all loaded IDs)
    // This handles the case where data is stored in paging.ids
    // instead of paging.pages
    if (paging.ids && paging.ids.length > 0) {
      return paging.ids;
    }

    return [];
  }, [paging.pages, paging.ids, currentPage]);

  // Use useSelector with memoization to get items from Redux
  const allUsers = useSelector<GlobalState, any[]>(
    (state: GlobalState) => {
      return allData
        .map((id: string) => getItemSelector(state, id))
        .filter(Boolean);
    },
    (left, right) => {
      // Custom equality check to prevent unnecessary rerenders
      if (left.length !== right.length) return false;

      return left.every(
        (item, index) => item?._identity === right[index]?._identity
      );
    }
  );

  // Filter users based on active filter and online status
  const filteredData = React.useMemo(() => {
    // If filter is 'all', show all users
    if (activeFilter === 'all') {
      return allData;
    }

    // For other filters, filter by online status and criteria
    const filtered = allUsers
      .filter((user: any) => {
        // Check if user is online
        // If status_user exists, check if it's Online (1)
        // If status_user doesn't exist, we'll show the user anyway (they might be online but API doesn't return the field)
        const hasStatusField =
          user?.status_user !== undefined && user?.status_user !== null;
        const isOnline = hasStatusField
          ? user?.status_user === UserStatusType.Online ||
            user?.status_user === 1
          : true; // If no status_user field, assume online (or you can check last_activity here)

        if (!isOnline) {
          return false;
        }

        // Apply gender/admin filters
        let passesFilter = false;
        switch (activeFilter) {
          case 'girls':
            passesFilter = user?.gender?.id === 2;
            break;
          case 'boys':
            passesFilter = user?.gender?.id === 1;
            break;
          case 'admins':
            passesFilter = user?.extra?.has_admin_access === true;
            break;
          default:
            passesFilter = true;
        }

        return passesFilter;
      })
      .map((user: any) => {
        // Return the identity string if available, otherwise construct it
        if (user._identity) return user._identity;

        if (user.id && user.module_name && user.resource_name) {
          return `${user.module_name}.entities.${user.resource_name}.${user.id}`;
        }

        return user.id;
      })
      .filter(Boolean);

    return filtered;
  }, [allUsers, activeFilter, allData]);

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Use filteredData as the list of IDs to display
  const data = filteredData;

  React.useEffect(() => {
    if (handleUpdateLastRead) {
      handleUpdateLastRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  React.useEffect(() => {
    const current_page = parseInt(
      pageParams?.page || pagesOffset?.current_page,
      10
    );
    setCurrentPage(current_page);

    if (current_page !== pageParams?.page && loadMore) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParams?.page, pagesOffset?.current_page]);

  React.useEffect(() => {
    if (!refreshing || dirty || !loadMore) return;

    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, refreshing]);

  if (!ItemView) return null;

  if (!gridItemProps.xs) {
    gridItemProps.xs = 12;
  }

  if (error) {
    if (errorPage === 'hide') return null;

    const message =
      get(error, 'response.data.error') ||
      get(error, 'response.data.message') ||
      get(error, 'response.data.meta.title');

    const content = get(error, 'response.data.meta.description');

    const errorName =
      get(error, 'response.status') === 403
        ? 'core.block.error403'
        : 'core.block.error404';
    const ErrorBlock = jsxBackend.get(errorName);

    if (errorPage === 'default') {
      return (
        <Block>
          <BlockHeader title={title} data={data} />
          <BlockContent>
            <ErrorBlock title={message} content={content} />
          </BlockContent>
        </Block>
      );
    }

    return <ErrorBlock title={message} content={content} />;
  }

  if ((!data.length && ended) || error) {
    if (emptyPage === 'hide') return null;

    if (typeof emptyPage !== 'string') return emptyPage;

    const NoResultsBlock = jsxBackend.get(emptyPage);

    if (!NoResultsBlock) return null;

    const { noBlock, contentStyle } = emptyPageProps || {};

    if (noBlock) {
      return <NoResultsBlock {...emptyPageProps} />;
    }

    return (
      <Block>
        <BlockHeader title={title} data={data}>
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant={activeFilter === 'all' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleFilterClick('all')}
                data-testid="filter-all"
              >
                {i18n.formatMessage({ id: 'all' })}
              </Button>
              <Button
                variant={activeFilter === 'girls' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleFilterClick('girls')}
                data-testid="filter-girls"
              >
                {i18n.formatMessage({ id: 'girls' })}
              </Button>
              <Button
                variant={activeFilter === 'boys' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleFilterClick('boys')}
                data-testid="filter-boys"
              >
                {i18n.formatMessage({ id: 'boys' })}
              </Button>
              <Button
                variant={activeFilter === 'admins' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleFilterClick('admins')}
                data-testid="filter-admins"
              >
                {i18n.formatMessage({ id: 'admins' })}
              </Button>
            </Box>
          </Box>
        </BlockHeader>
        <BlockContent {...contentStyle}>
          {React.createElement(NoResultsBlock, { ...emptyPageProps })}
        </BlockContent>
      </Block>
    );
  }

  if (!initialized) {
    if (!Skeleton) {
      return (
        <div data-testid="loadingIndicator">
          {i18n.formatMessage({ id: 'loading_dots' })}
        </div>
      );
    }

    return (
      <Block>
        <BlockHeader title={title} />
        <BlockContent>
          <Grid
            container
            sx={{ '&:empty': { display: 'none' } }}
            {...gridContainerProps}
          >
            {range(0, limitSkeleton).map(index => (
              <Skeleton
                testid="loadingIndicator"
                wrapAs={Grid}
                wrapProps={gridItemProps}
                itemProps={itemProps}
                key={index.toString()}
              />
            ))}
          </Grid>
        </BlockContent>
      </Block>
    );
  }

  return (
    <Block>
      <BlockHeader title={title} data={data}>
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            <Button
              variant={activeFilter === 'all' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleFilterClick('all')}
              data-testid="filter-all"
            >
              {i18n.formatMessage({ id: 'all' })}
            </Button>
            <Button
              variant={activeFilter === 'girls' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleFilterClick('girls')}
              data-testid="filter-girls"
            >
              {i18n.formatMessage({ id: 'girls' })}
            </Button>
            <Button
              variant={activeFilter === 'boys' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleFilterClick('boys')}
              data-testid="filter-boys"
            >
              {i18n.formatMessage({ id: 'boys' })}
            </Button>
            <Button
              variant={activeFilter === 'admins' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleFilterClick('admins')}
              data-testid="filter-admins"
            >
              {i18n.formatMessage({ id: 'admins' })}
            </Button>
          </Box>
        </Box>
      </BlockHeader>
      <BlockContent>
        {!hideTopPagination ? (
          <Pagination
            currentPage={currentPage}
            from={paging.pages[currentPage]?.from}
            to={paging.pages[currentPage]?.to}
            total={pagesOffset?.total_item || pagesOffset?.total}
            itemsPerPage={perPage}
            message={messagePagination}
            hasSort={hasSort}
            moduleName={moduleName}
            resourceName={resourceName}
            actionName={actionSortName}
          />
        ) : null}
        <Grid container {...gridContainerProps}>
          {isArray(data) &&
            data.map((id, index) => (
              <ItemView
                index={index}
                identity={id}
                itemProps={itemProps}
                key={id.toString()}
                wrapAs={Grid}
                wrapProps={gridItemProps}
                pagingId={pagingId}
                handleActionItem={handleActionItem}
              />
            ))}
          {loading && Skeleton ? (
            <>
              {range(0, limitSkeleton).map(index => (
                <Skeleton
                  wrapAs={Grid}
                  wrapProps={gridItemProps}
                  itemProps={itemProps}
                  key={index.toString()}
                />
              ))}
            </>
          ) : null}
        </Grid>
        {!hideBottomPagination ? (
          <Pagination
            currentPage={currentPage}
            from={paging.pages[currentPage]?.from}
            to={paging.pages[currentPage]?.to}
            total={pagesOffset?.total_item || pagesOffset?.total}
            itemsPerPage={perPage}
            message={messagePagination}
          />
        ) : null}
      </BlockContent>
    </Block>
  );
}

export default withPagination(ListViewPagination);
