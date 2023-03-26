
// 어플리케이션 상태 관리
var systemDB;
var dataSet = []; // 게시글 목록

// DOM 요소들
var articleIdInput = document.getElementById('article-id');
var boardList = document.getElementById('board-list');
var userNameInput = document.getElementById('user-name');
var articleContentInput = document.getElementById('article-content');
var buttonReset = document.getElementById('button-reset');
var buttonInsert = document.getElementById('button-insert');
var buttonUpdate = document.getElementById('button-update');
var buttonDrop = document.getElementById('button-drop');
var buttonEditList = document.getElementsByClassName('button-edit');

// 브라우저에 DOM 이 모두 로드되면 실행합니다.
document.addEventListener('DOMContentLoaded', function (event) {

  // 브라우저가 Web SQL Database 를 지원하는지 체크한 후에, 데이터베이스를 초기화합니다.
  initDatabase();

  // "글 지우기" 버튼을 클릭하면 사용자 입력 양식을 비웁니다.
  buttonReset.onclick = function () {
    resetForm();
    userNameInput.focus();
  };

  // "글 쓰기" 버튼을 클릭하면 INSERT 동작을 수행합니다.
  buttonInsert.onclick = function () {
    insertDataTo(systemDB);
  };

  // "글 수정" 버튼을 클릭하면 UPDATE 동작을 수행합니다.
  buttonUpdate.onclick = function () {
    updateDataTo(systemDB);
  };

  // "DB 삭제" 버튼을 클릭하면 DROP TABLE 동작을 수행합니다.
  buttonDrop.onclick = function () {
    dropDatabase(systemDB);
  };

  // "edit" 버튼을 클릭하면 해당 게시글의 번호를 읽어서 사용자 입력 영역으로 불러옵니다. fixme: jQuery 쓰지 말기
  $('body').on('click', '.button-edit', function () {
    const dataNo = $(this).data('no');
    const dataIdx = $(this).data('idx');
    articleIdInput.value = dataIdx;
    loadRecord(parseInt(dataNo));
  });

  // "delete" 버튼을 클릭하면 해당 게시글의 번호를 읽어서 삭제를 실행합니다. fixme: jQuery 쓰지 말기
  $('body').on('click', '.button-delete', function () {
    const dataIdx = parseInt($(this).data('idx'));
    deleteDataTo(systemDB, dataIdx);
  });

});

/**
 * 브라우저가 Web SQL Database 를 지원하는지 체크한 후에, 데이터베이스를 초기화합니다.
 */
function initDatabase() {
  if (!window.openDatabase) {
    alert('현재 브라우저는 Web SQL Database 를 지원하지 않습니다.');
    return;
  }

  // 브라우저에 생성할 데이터베이스 기본 정보들을 설정하니다.
  const shortName = 'Board'; // 데이터베이스 이름
  const version = '1.0'; // 데이터베이스 버전 번호 지정 (자기가 원하는 번호 아무렇게나)
  const displayName = 'Board DB'; // 화면에 표시할 데이터베이스 이름
  const maxSize = 64*1024; // 바이트 단위, 데이터베이스의 크기

  // 위에서 지정한 설정대로 데이터베이스를 생성합니다.
  systemDB = openDatabase(
    shortName,
    version,
    displayName,
    maxSize
  );

  // 데이터베이스에 테이블 tbl_board 를 생성합니다.
  createBoardTableTo(systemDB);

  // 저장된 모든 데이터들을 SELECT 하고 현재 문서에 표현합니다.
  selectAllArticles(systemDB);
}

/**
 * 데이터베이스에 테이블 tbl_board 생성 문을 수행합니다.
 * @param db {Database}
 */
function createBoardTableTo(db) {
  // 실행할 CREATE 문
  const tableCreationSQL = `
    CREATE TABLE IF NOT EXISTS tbl_board
    (idx INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
     username TEXT NOT NULL,
     content TEXT NOT NULL,
     regdate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)
  `;

  // CREATE 문 실행
  db.transaction(function (transaction) {
    transaction.executeSql(tableCreationSQL);
  });
}

/**
 * 데이터베이스의 테이블 tbl_board 에 테스트용 데이터들을 넣습니다.
 * @param db {Database}
 */
function insertTestDataTo(db) {
  db.transaction(function (transaction) {
    transaction.executeSql(`
      INSERT INTO tbl_board(username, content) values ('test', '1 번째 글입니다.')
    `);
    transaction.executeSql(`
      INSERT INTO tbl_board(username, content) values ('test', '2 번째 글입니다.')
    `);
    transaction.executeSql(`
      INSERT INTO tbl_board(username, content) values ('test', '3 번째 글입니다.')
    `);
  });
}

/**
 * 데이터베이스의 테이블 tbl_board 에 저장된 모든 데이터들을 SELECT 하고 현재 문서에 표현합니다.
 * @param db {Database}
 */
function selectAllArticles(db) {
  // 실행할 SELECT 문
  const tableSelectSQL = `
    SELECT * FROM tbl_board ORDER BY idx DESC
  `;

  // SELECT 문 실행
  db.transaction(function (transaction) {
    transaction.executeSql(tableSelectSQL, [], function (transaction, resultSet) {

      // SELECT 문 조회 결과 데이터를 현재 어플리케이션 상태에 동기화합니다.
      dataSet = resultSet.rows;

      // 조회된 게시글들을 현재 문서에 보여주기 위해 HTML 문자열로 작성합니다.
      let htmlString = '';
      if (dataSet.length === 0) { // 조회된 게시글이 한 건도 없으면
        htmlString += '게시글이 없습니다.';
      } else {
        // 조회된 게시글 하나씩 순회하며 DOM 요소 문자열을 추가합니다.
        for (let i = 0 ; i < dataSet.length ; i++) {
          const item = dataSet.item(i);
          const itemHTMLString = `
            <li>
              ${item['idx']}:${item['username']}:${item['content']}:${item['regdate']}
              <span class="button-edit" data-no="${i}" data-idx="${item['idx']}">edit</span>
              <span class="button-delete" data-no="${i}" data-idx="${item['idx']}">delete</span>
            </li>
          `;
          htmlString += itemHTMLString;
        }
      }

      // 조회된 게시글들을 표현한 HTML 문자열을 현재 문서에 포함시킵니다.
      boardList.innerHTML = `<ol>${htmlString}</ol>`;
    });
  });
}

/**
 * 데이터베이스 테이블 tbl_board 에 현재 사용자가 필드에 입력한 값들 대로 새 데이터를 INSERT 합니다.
 * @param db {Database}
 */
function insertDataTo(db) {
  // 실행할 INSERT 문
  const dataInsertSQL = `
    INSERT INTO tbl_board(username, content) values(?, ?)
  `;

  // 현재 화면에 사용자가 입력한 값들을 읽어들입니다.
  const userName = userNameInput.value || '';
  const articleContent = articleContentInput.value || '';

  // 사용자 입력 필드들 중 하나라도 비어있을 경우
  if (userName.trim() === '' || articleContent.trim() === '') {
    userNameInput.focus(); // 사용자 입력 필드로 포커스를 이동시킵니다.
    alert('사용자 이름 또는 글을 적어주세요.'); // 사용자에게 값 입력이 필요함을 알려줍니다.
    return;
  }

  // INSERT 문을 실행합니다.
  db.transaction(function (transaction) {
    transaction.executeSql(
      dataInsertSQL,
      [userName, articleContent],
      loadAndReset, // 트랜잭션 종료 후 실행할 콜백 함수
      errorHandler // 트랜잭션 중 에러 발생 시 실행할 함수
    );
  });
}

/**
 * 데이터베이스 테이블 tbl_board 의 특정 데이터를 UPDATE 합니다.
 * @param db {Database}
 */
function updateDataTo(db) {
  // 실행할 UPDATE 문
  const dataUpdateSQL = `
    UPDATE tbl_board SET username = ?, content = ? WHERE idx = ?
  `;

  // 현재 화면에 사용자가 입력한 값들을 읽어들입니다.
  const userName = userNameInput.value || '';
  const articleContent = articleContentInput.value || '';
  const articleId = parseInt(articleIdInput.value || '-1');

  // 기존 글을 수정하는 상태가 아닌 경우에는 아무 일도 하지 않습니다.
  if (articleId === -1) {
    alert('수정 모드가 아닙니다. 아래 게시글들 중에서 수정할 글의 "edit" 버튼을 클릭해주세요.');
    return;
  }

  // 사용자 입력 필드들 중 하나라도 비어있을 경우
  if (userName.trim() === '' || articleContent.trim() === '') {
    userNameInput.focus(); // 사용자 입력 필드로 포커스를 이동시킵니다.
    alert('사용자 이름 또는 글을 적어주세요.'); // 사용자에게 값 입력이 필요함을 알려줍니다.
    return;
  }

  // UPDATE 문을 실행합니다.
  db.transaction(function (transaction) {
    transaction.executeSql(
      dataUpdateSQL,
      [userName, articleContent, articleId],
      loadAndReset, // 트랜잭션 종료 후 실행할 콜백 함수
      errorHandler // 트랜잭션 중 에러 발생 시 실행할 함수
    );
  });
}

/**
 * 데이터베이스 테이블 tbl_board 의 특정 데이터를 DELETE 합니다.
 * @param db {Database}
 * @param idx {number}
 */
function deleteDataTo(db, idx) {
  // 삭제 대상 데이터 인덱스가 0 이하이면 비정상이므로 실행하지 않습니다.
  if (idx <= 0) {
    alert('삭제할 글을 선택해주세요.');
    return;
  }

  // 정말 삭제할 것인지 물어보고, 아니라고 하면 실행하지 않습니다.
  if (!confirm(`정말 삭제하시겠습니까? (대상 : ${idx})`)) {
    return;
  }

  // 실행할 DELETE 문
  const dataDeleteSQL = `
    DELETE FROM tbl_board WHERE idx = ?
  `;

  // DELETE 문을 실행합니다.
  db.transaction(function (transaction) {
    transaction.executeSql(
      dataDeleteSQL,
      [idx],
      loadAndReset, // 트랜잭션 종료 후 실행할 콜백 함수
      errorHandler // 트랜잭션 중 에러 발생 시 실행할 함수
    );
  });
}

/**
 * 데이터베이스 테이블 tbl_board 를 DROP 합니다.
 * @param db {Database}
 */
function dropDatabase(db) {
  // 정말 삭제할 것인지 물어보고, 아니라고 하면 실행하지 않습니다.
  if (!confirm(`정말 테이블 전체 데이터를 삭제하시겠습니까?`)) {
    return;
  }

  // 실행할 DROP TABLE 문
  const tableDropSQL = `DROP TABLE tbl_board`;

  // DROP TABLE 문을 실행합니다.
  db.transaction(function (transaction) {
    transaction.executeSql(
      tableDropSQL,
      [],
      loadAndReset, // 트랜잭션 종료 후 실행할 콜백 함수
      errorHandler // 트랜잭션 중 에러 발생 시 실행할 함수
    );
  });

  // 테이블이 삭제되었으므로, 데이터베이스를 초기화하여 테이블을 다시 생성합니다.
  initDatabase();
}

/**
 * 편집하려는 데이터의 번호(no) 를 전달받고 해당 데이터 값들을 사용자 입력 영역으로 불러옵니다.
 * @param no {number}
 */
function loadRecord(no) {
  const item = dataSet.item(no);
  userNameInput.value = item['username'].toString();
  articleContentInput.value = item['content'].toString();
}

/**
 * 사용자 입력 필드를 초기화하고, 전체 글 목록을 다시 읽어들여서 화면을 다시 그립니다.
 */
function loadAndReset() {
  resetForm();
  selectAllArticles(systemDB);
}

/**
 * 사용자 입력 필드를 초기화합니다.
 */
function resetForm() {
  userNameInput.value = '';
  articleContentInput.value = '';
}

/**
 * 데이터베이스 트랜잭션 도중 에러가 발생하면 실행할 함수입니다.
 * @param error
 */
function errorHandler(error) {
  alert(`Error Occurred : ${error.message} (CODE: ${error.code})`);
}
